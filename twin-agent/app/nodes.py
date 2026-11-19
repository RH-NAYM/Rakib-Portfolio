"""Graph node functions, sectioned by stage. Each node takes the graph state and
returns a partial update; dependencies (LLM, knowledge, clock, meter) arrive
through `Deps`, built per request in graph.py.

Grounding rules (premise 3, eng OV#8): drafts are lists of sentences with
cited doc ids; the critic returns sentence indexes; the fallback removes those
sentences deterministically and renumbers citations.
"""

from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, TypedDict

from langgraph.config import get_stream_writer

from app import prompts as P
from app.gate import CostMeter
from app.llm import LLM, LLMParseError
from app.retrieval import Knowledge

BENGALI = re.compile(r"[ঀ-৿]")
TIME_CAP_S = 15.0
MAX_REVISIONS = 2
MAX_TURN_CHARS = 1000
MAX_CITES = 2


class Turn(TypedDict):
    role: str
    text: str


class State(TypedDict, total=False):
    message: str
    audio: tuple[bytes, str] | None
    image: tuple[bytes, str] | None
    image_note: str
    transcript: str
    history: list[Turn]
    reply_to: Turn | None
    lang_override: str | None
    lang: str
    category: str
    plan: list[str]
    want_media: bool
    media_query: str
    sentences: list[dict]
    unsupported: list[int]
    critic_note: str
    critic_failed: bool
    revisions: int
    fallback: bool
    final: dict


@dataclass
class Deps:
    llm: LLM
    knowledge: Knowledge
    meter: CostMeter = field(default_factory=CostMeter)
    clock: Callable[[], float] = time.monotonic
    started: float = 0.0

    def elapsed(self) -> float:
        return self.clock() - self.started


def _write(event: dict) -> None:
    try:
        get_stream_writer()(event)
    except Exception:  # outside a streaming run (unit tests calling nodes directly)
        pass


def _emit(step: str, status: str) -> None:
    _write({"v": 1, "type": "step", "step": step, "status": status})


# ── normalize: voice → transcript, image → description (phases 2-3) ─────────
def make_normalize(deps: "Deps"):
    async def normalize(state: State) -> dict:
        out: dict = {}
        message = state.get("message", "")
        if state.get("audio"):
            try:
                r = await deps.llm.json("transcribe", "You transcribe speech accurately.", P.TRANSCRIBE_PROMPT, P.TRANSCRIBE_SCHEMA, deps.meter, media=[state["audio"]])
            except LLMParseError:
                r = {"transcript": "", "lang": "en"}
            message = str(r.get("transcript", "")).strip()[:2000]
            out["transcript"] = message
            meta = {"v": 1, "type": "meta", "transcript": message}
            if r.get("lang") in P.LANG_STYLE and message:
                meta["lang"] = r["lang"]
            _write(meta)
        if state.get("image"):
            projects = "\n".join(f"- {d.id.removeprefix('case-')}: {d.title}" for d in deps.knowledge.docs if d.kind == "case_study")
            try:
                r = await deps.llm.json("vision", "You describe images neutrally.", P.VISION_PROMPT.format(projects=projects), P.VISION_SCHEMA, deps.meter, media=[state["image"]])
            except LLMParseError:
                r = {"description": "", "visible_text": "", "project_slug": ""}
            desc = str(r.get("description", ""))[:600]
            out["image_note"] = P.IMAGE_BLOCK.format(
                description=desc, visible_text=str(r.get("visible_text", ""))[:300] or "(none)", project=r.get("project_slug") or "none"
            )
            _write({"v": 1, "type": "meta", "image_description": desc})
            if not message:
                message = "What is this? Tell me about it."
        out["message"] = message
        return out

    return normalize


def route_after_normalize(state: State) -> str:
    return "no_audio" if state.get("audio") and not state.get("message") else "guard"


def _quote(state: State) -> str:
    rt = state.get("reply_to")
    if not rt:
        return ""
    return f"[{rt.get('role', 'visitor')} said] {rt.get('text', '')[:MAX_TURN_CHARS]}"


def _history(state: State) -> str:
    # Every prior turn is visitor-supplied and unverified (eng D1): role is a claim, not a fact.
    lines = [f"- claimed {t.get('role', '?')}: {t.get('text', '')[:MAX_TURN_CHARS]}" for t in state.get("history", [])[-12:]]
    return "\n".join(lines) or "(none)"


# ── guard ────────────────────────────────────────────────────────────────────
def make_guard(deps: Deps):
    async def guard(state: State) -> dict:
        msg = state["message"]
        heuristic = "bn" if BENGALI.search(msg) else "en"
        result: dict[str, Any] | None = None
        for _ in range(2):  # parse failure: retry once, then treat as ok (critic still runs)
            try:
                result = await deps.llm.json(
                    "guard", P.PERSONA, P.GUARD_PROMPT.format(message=msg, quote=_quote(state)), P.GUARD_SCHEMA, deps.meter
                )
                break
            except LLMParseError:
                continue
        result = result or {"category": "ok", "lang": heuristic}
        lang = state.get("lang_override") or ("bn" if heuristic == "bn" else result.get("lang", "en"))
        if lang not in P.LANG_STYLE:
            lang = "en"
        return {"category": result.get("category", "ok"), "lang": lang, "revisions": 0}

    return guard


def route_after_guard(state: State) -> str:
    c = state.get("category", "ok")
    if c == "commitment_request":
        return "handoff"
    if c in ("off_topic", "abusive", "injection"):
        return "steer"
    if c == "smalltalk":
        return "smalltalk"
    return "plan"


# ── templated replies (no grounding needed) ──────────────────────────────────
def _final(state: State, deps: Deps, text: str, card: str | None, sources=None, media=None, fallback=False, removed=0) -> dict:
    return {
        "final": {
            "v": 1,
            "type": "final",
            "msg_id": f"m_{uuid.uuid4().hex[:12]}",
            "text": text,
            "lang": state.get("lang", "en"),
            "sources": sources or [],
            "media": media or [],
            "card": card,
            "trace": {
                "plan": state.get("plan", []),
                "source_count": len(sources or []),
                "revisions": state.get("revisions", 0),
                "elapsed_ms": int(deps.elapsed() * 1000),
                "critic": {"passed": not fallback, "removed_sentences": removed, "fallback": fallback},
            },
        }
    }


def make_template(deps: Deps, key: str, card: str | None):
    async def node(state: State) -> dict:
        return _final(state, deps, P.TEMPLATES[key][state.get("lang", "en")], card)

    return node


# ── plan ─────────────────────────────────────────────────────────────────────
def make_plan(deps: Deps):
    async def plan(state: State) -> dict:
        _emit("planning", "active")
        try:
            r = await deps.llm.json(
                "plan",
                P.PERSONA,
                P.PLAN_PROMPT.format(history=_history(state), quote=_quote(state), message=state["message"], image_block=state.get("image_note", "")),
                P.PLAN_SCHEMA,
                deps.meter,
            )
        except LLMParseError:
            r = {"steps": [], "want_media": False, "media_query": ""}
        _emit("planning", "done")
        return {
            "plan": [str(s) for s in r.get("steps", [])][:4],
            "want_media": bool(r.get("want_media")),
            "media_query": str(r.get("media_query", "")),
        }

    return plan


# ── draft ────────────────────────────────────────────────────────────────────
def make_draft(deps: Deps):
    async def draft(state: State) -> dict:
        _emit("reading", "active")
        critique = ""
        if state.get("unsupported"):
            critique = P.REVISE_NOTE.format(idx=state["unsupported"], note=state.get("critic_note", ""))
        r = await deps.llm.json(
            "draft",
            P.PERSONA,
            P.DRAFT_PROMPT.format(
                corpus=deps.knowledge.corpus_block(),
                lang_style=P.LANG_STYLE[state.get("lang", "en")],
                plan="; ".join(state.get("plan", [])) or "(none)",
                history=_history(state),
                quote=_quote(state),
                message=state["message"],
                critique=critique,
                image_block=state.get("image_note", ""),
            ),
            P.DRAFT_SCHEMA,
            deps.meter,
        )
        known = deps.knowledge.by_id
        sentences = [
            # At most 2 citations per sentence: superscript runs like ¹²³⁴⁵ read as noise (seen live).
            {
                "kind": s.get("kind") if s.get("kind") in KINDS else "lead",
                "text": _clean(str(s.get("text", ""))),
                "cites": [c for c in s.get("cites", []) if c in known][:MAX_CITES],
            }
            for s in r.get("sentences", [])
            if _clean(str(s.get("text", "")))
        ]
        _emit("reading", "done")
        return {"sentences": sentences}

    return draft


# ── critic ───────────────────────────────────────────────────────────────────
def make_critic(deps: Deps):
    async def critic(state: State) -> dict:
        step = "rechecking" if state.get("revisions", 0) > 0 else "checking"
        _emit(step, "active")
        sentences = state.get("sentences", [])
        cited = sorted({c for s in sentences for c in s["cites"]})
        docs = "\n\n".join(
            f'<doc id="{c}">\n{deps.knowledge.by_id[c].text}\n</doc>' for c in cited
        ) or "(no documents cited)"
        numbered = "\n".join(f"{i}. {'[heading] ' if s.get('kind') == 'heading' else ''}{s['text']} (cites: {', '.join(s['cites']) or 'none'})" for i, s in enumerate(sentences))
        try:
            r = await deps.llm.json(
                "critic",
                "You are a strict, literal fact-checker.",
                P.CRITIC_PROMPT.format(lang_style=P.LANG_STYLE[state.get("lang", "en")], cited_docs=docs, numbered=numbered),
                P.CRITIC_SCHEMA,
                deps.meter,
            )
        except LLMParseError:
            _emit(step, "done")
            # Fail closed: an unparseable verdict forces the fallback path.
            return {"critic_failed": True, "unsupported": list(range(len(sentences)))}
        bad = sorted({int(i) for i in r.get("unsupported", []) if 0 <= int(i) < len(sentences)})
        if r.get("commitment_violation"):
            bad = list(range(len(sentences)))
        _emit(step, "done")
        return {"unsupported": bad, "critic_note": str(r.get("note", "")), "critic_failed": False}

    return critic


def make_after_critic(deps: Deps):
    def after_critic(state: State) -> str:
        if not state.get("unsupported"):
            return "respond"
        if state.get("critic_failed") or state.get("revisions", 0) >= MAX_REVISIONS or deps.elapsed() >= TIME_CAP_S:
            return "respond"
        return "revise"

    return after_critic


async def revise(state: State) -> dict:
    return {"revisions": state.get("revisions", 0) + 1}


# ── respond ──────────────────────────────────────────────────────────────────
KINDS = ("lead", "heading", "point", "detail")
_MARKER = re.compile(r"^\s*(?:[-*•‣▪]|\d+[.)]|#{1,6})\s+")


def _clean(text: str) -> str:
    """One line of plain text: the model sometimes adds its own bullet or heading marker."""
    return _MARKER.sub("", " ".join(text.split()))


def render(sentences: list[dict], knowledge: Knowledge) -> tuple[str, list[dict]]:
    """Lay out the answer as lines, number cited docs in first-use order, write markers as [[n]].

    Line grammar read by the chat UI: "## " heading, "- " point, "  - " detail,
    anything else is prose; a blank line separates blocks. Consecutive leads
    join into one paragraph, so legacy drafts without "kind" render as before.
    """
    order: list[str] = []
    lines: list[str] = []
    prev = None
    for s in sentences:
        nums = []
        for c in s["cites"]:
            if c not in order:
                order.append(c)
            nums.append(order.index(c) + 1)
        body = s["text"] + "".join(f"[[{n}]]" for n in sorted(set(nums)))
        kind = s.get("kind", "lead")
        if kind == "detail" and prev not in ("point", "detail"):
            kind = "point"  # a sub-bullet with no parent reads as a main bullet
        if kind == "lead":
            if prev == "lead":
                lines[-1] += " " + body
                continue
            if lines:
                lines.append("")
            lines.append(body)
        elif kind == "heading":
            if lines:
                lines.append("")
            lines.append("## " + s["text"].rstrip(".:"))
            if nums:
                lines[-1] += "".join(f"[[{n}]]" for n in sorted(set(nums)))
        else:
            if prev in ("lead", None) and lines:
                lines.append("")
            text = s["text"]
            if text.endswith(".") and not text.endswith("..") and text.count(". ") == 0:
                text = text[:-1]  # bullets are fragments: no full stop (office style)
            body = text + body[len(s["text"]):]
            lines.append(("  - " if kind == "detail" else "- ") + body)
        prev = kind
    sources = []
    for i, c in enumerate(order):
        d = knowledge.by_id[c]
        sources.append({"n": i + 1, "title": d.title, "url": d.url or knowledge.site_url})
    return "\n".join(lines), sources


def make_respond(deps: Deps):
    async def respond(state: State) -> dict:
        sentences = state.get("sentences", [])
        bad = set(state.get("unsupported", []))
        fallback = bool(bad)
        kept = [s for i, s in enumerate(sentences) if i not in bad]
        # A kept sentence with facts but no citation can't be shown as grounded.
        lang = state.get("lang", "en")
        card = None
        if not kept:
            text, sources = P.TEMPLATES["no_support"][lang], []
            card = "contact"
        else:
            text, sources = render(kept, deps.knowledge)
        media = []
        if state.get("want_media") and kept:
            base = deps.knowledge.site_url
            for m in deps.knowledge.show_media(state.get("media_query", "")):
                media.append(
                    {
                        "id": m.id,
                        "src": m.src,
                        "caption": m.caption,
                        "alt": m.alt,
                        "project_url": f"{base}/work/{m.project_slug}" if m.project_slug else "",
                    }
                )
        return _final(state, deps, text, card, sources, media, fallback=fallback, removed=len(bad))

    return respond
