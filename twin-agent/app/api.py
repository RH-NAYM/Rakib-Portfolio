"""FastAPI entrypoint (Vercel Services, D17): POST /api/twin/chat streams SSE
events defined in contracts/sse-events.schema.json (eng D4, `v` field per D9).

Vercel routes /api/twin/* here with the original path. The service is public
behind that rewrite, so the client IP comes only from Vercel's edge headers
(gate.client_ip), never from a request-supplied custom header.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import AsyncIterator, Literal

from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field, field_validator

import base64
import time
from collections import Counter
from datetime import datetime, timedelta

import httpx

from app import prompts as P
from app.gate import DHAKA, CostMeter, derived_secret, limits_mode, service_account_info, Gate, check_password, check_startup, client_ip, dhaka_day, gate_from_env, ip_key, log_turn, sign_token, verify_token
from app.graph import build_graph
from app.llm import LLM, GeminiLLM
from app.nodes import Deps
from app.retrieval import Knowledge

log = logging.getLogger("twin")
logging.basicConfig(level=logging.INFO, format="%(message)s")

REQUEST_TIMEOUT_S = float(os.environ.get("TWIN_REQUEST_TIMEOUT_S", "25"))
MAX_MESSAGE = 2000


class TurnIn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=4000)

    @field_validator("text")
    @classmethod
    def clip(cls, v: str) -> str:
        return v[:1000]


IMAGE_MIMES = ("image/jpeg", "image/png", "image/webp")
AUDIO_MIMES = ("audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/aac")
MAX_IMAGE_B64 = 2_100_000  # ~1.5 MB binary (client resizes to <1 MB; design 2A)
MAX_AUDIO_B64 = 1_400_000  # ~1 MB binary, 60 s of opus


class MediaIn(BaseModel):
    mime: str
    data: str  # base64

    def decode(self) -> tuple[bytes, str]:
        return base64.b64decode(self.data, validate=True), self.mime.split(";")[0]


class ChatIn(BaseModel):
    message: str = Field(default="", max_length=MAX_MESSAGE)
    history: list[TurnIn] = Field(default_factory=list, max_length=40)
    reply_to: TurnIn | None = None
    lang: Literal["auto", "en", "bn", "banglish"] = "auto"
    image: MediaIn | None = None
    audio: MediaIn | None = None

    @field_validator("image")
    @classmethod
    def check_image(cls, v: MediaIn | None) -> MediaIn | None:
        if v and (v.mime not in IMAGE_MIMES or len(v.data) > MAX_IMAGE_B64):
            raise ValueError("unsupported image")
        return v

    @field_validator("audio")
    @classmethod
    def check_audio(cls, v: MediaIn | None) -> MediaIn | None:
        if v and (v.mime.split(";")[0] not in AUDIO_MIMES or len(v.data) > MAX_AUDIO_B64):
            raise ValueError("unsupported audio")
        return v

    def model_post_init(self, _ctx) -> None:
        if not (self.message.strip() or self.image or self.audio):
            raise ValueError("empty message")


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    lang: Literal["en", "bn", "banglish"] = "en"


SESSION_COOKIE = "twin_session"
ADMIN_COOKIE = "twin_admin"
VOICES = {"en": os.environ.get("TWIN_VOICE_EN", "Charon"), "bn": os.environ.get("TWIN_VOICE_BN", "Charon")}


def _magic_ok(data: bytes, mime: str) -> bool:
    """Sniff the real type; never trust the declared MIME alone (design: upload MIME sniffing)."""
    sig = {
        "image/jpeg": [b"\xff\xd8\xff"], "image/png": [b"\x89PNG"], "image/webp": [b"RIFF"],
        "audio/webm": [b"\x1a\x45\xdf\xa3"], "audio/ogg": [b"OggS"], "audio/wav": [b"RIFF"],
        "audio/mpeg": [b"ID3", b"\xff\xfb", b"\xff\xf3"], "audio/mp4": [b"ftyp"], "audio/aac": [b"\xff\xf1", b"\xff\xf9"],
    }.get(mime, [])
    head = data[:12]
    return any(head.startswith(m) or (m == b"ftyp" and head[4:8] == b"ftyp") for m in sig)


def sse(event: dict) -> bytes:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode()


def error_event(kind: str, retry_after_s: int | None = None) -> dict:
    e: dict = {"v": 1, "type": "error", "kind": kind}
    if retry_after_s is not None:
        e["retry_after_s"] = int(retry_after_s)
    return e


def chunk_text(text: str) -> list[str]:
    """Stream the approved answer a few words at a time; keep [[n]] markers intact."""
    parts = re.findall(r"\S+\s*", text)
    return ["".join(parts[i : i + 3]) for i in range(0, len(parts), 3)]


def create_app(llm: LLM | None = None, knowledge: Knowledge | None = None, gate: Gate | None = None) -> FastAPI:
    fast = os.environ.get("TWIN_MODEL_FAST", "gemini-2.5-flash")
    main = os.environ.get("TWIN_MODEL_MAIN", fast)
    check_startup([fast, main])
    app = FastAPI(title="twin-agent", docs_url=None, redoc_url=None)
    state = {"llm": llm, "knowledge": knowledge or Knowledge.load(), "gate": gate or gate_from_env()}

    def get_llm() -> LLM:
        if state["llm"] is None:
            state["llm"] = GeminiLLM(fast, main)
        return state["llm"]

    router = APIRouter()
    session_secret = derived_secret("session")
    admin_secret = derived_secret("admin")
    turnstile_secret = os.environ.get("TURNSTILE_SECRET_KEY", "")
    logging_on = os.environ.get("TWIN_LOG_CONVERSATIONS") == "true"

    def session_ok(request: Request) -> bool:
        # Bot check is opt-in: off until TURNSTILE_SECRET_KEY + TWIN_SESSION_SECRET exist (phase 1b).
        if not (turnstile_secret and session_secret):
            return True
        return verify_token(request.cookies.get(SESSION_COOKIE), session_secret, "visitor") is not None

    @router.get("/healthz")
    async def healthz() -> dict:
        # Config summary (no secrets) so a deploy can be checked from outside: is Gemini configured,
        # which limits store is active, which optional features are on.
        try:
            sa = service_account_info()
        except RuntimeError:
            sa = None
        gemini = "vertex" if sa or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") else ("developer_api" if os.environ.get("GEMINI_API_KEY") else "missing")
        return {
            "ok": gemini != "missing" or state["llm"] is not None,
            "docs": len(state["knowledge"].docs),
            "gemini": gemini,
            "limits": limits_mode(),
            "bot_check": bool(turnstile_secret and session_secret),
            "logging": logging_on,
            "admin": bool(os.environ.get("ADMIN_PASSWORD_HASH") and admin_secret),
        }

    @router.post("/session")
    async def session(request: Request):
        """Turnstile token → signed HttpOnly session cookie (2h). Design 2C, eng R1-4."""
        if not (turnstile_secret and session_secret):
            return {"ok": True, "bot_check": False}
        try:
            token = str((await request.json()).get("token", ""))[:4096]
        except Exception:
            token = ""
        ok = False
        if token:
            try:
                async with httpx.AsyncClient(timeout=8) as c:
                    r = await c.post(
                        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                        data={"secret": turnstile_secret, "response": token, "remoteip": client_ip(request.headers)},
                    )
                ok = bool(r.json().get("success"))
            except Exception:
                log.exception("turnstile verify failed")
        if not ok:
            return JSONResponse({"ok": False}, status_code=403)
        resp = JSONResponse({"ok": True, "bot_check": True})
        resp.set_cookie(SESSION_COOKIE, sign_token({"aud": "visitor", "sid": os.urandom(8).hex()}, session_secret, 7200),
                        max_age=7200, httponly=True, secure=True, samesite="lax", path="/api/twin")
        return resp

    @router.post("/tts")
    async def tts(request: Request):
        """Speak a twin reply (phase 3). Banglish is transliterated to Bengali script first (premise 6)."""
        if not session_ok(request):
            return JSONResponse({"kind": "session_required"}, status_code=401)
        try:
            body = TtsIn.model_validate(await request.json())
        except Exception:
            return JSONResponse({"kind": "bad_request"}, status_code=400)
        gate: Gate = state["gate"]
        v = await asyncio.to_thread(gate.admit, client_ip(request.headers), None, "tts")
        if not v.ok:
            return JSONResponse({"kind": v.kind, "retry_after_s": v.retry_after_s}, status_code=429)
        meter = CostMeter()
        llm = get_llm()
        text = re.sub(r"\[\[\d+\]\]", "", body.text)
        try:
            if body.lang == "banglish":
                r = await llm.json("transliterate", "You convert Banglish to Bengali script.", P.TRANSLITERATE_PROMPT.format(text=text), P.TRANSLITERATE_SCHEMA, meter)
                text = str(r.get("bangla") or text)
            wav = await llm.speech(text, VOICES["en" if body.lang == "en" else "bn"], meter)
        except Exception:
            log.exception("tts failed")
            return JSONResponse({"kind": "upstream_unavailable"}, status_code=502)
        finally:
            await asyncio.to_thread(gate.record_spend, meter)
        return Response(wav, media_type="audio/wav", headers={"Cache-Control": "private, max-age=86400"})

    @router.post("/admin/login")
    async def admin_login(request: Request):
        """Phase 4. 5 attempts / 15 min per IP; signed 12h admin cookie with its own secret + audience."""
        stored = os.environ.get("ADMIN_PASSWORD_HASH")
        if not (stored and admin_secret):
            return JSONResponse({"ok": False, "reason": "admin not configured"}, status_code=404)
        gate: Gate = state["gate"]
        now = datetime.now(DHAKA)
        bucket = f"adm_{ip_key(client_ip(request.headers), gate.secret)}_{now:%Y%m%d%H}{now.minute // 15}"
        if await asyncio.to_thread(gate.backend.incr, bucket, 1) > 5:
            return JSONResponse({"ok": False, "reason": "too many attempts"}, status_code=429)
        try:
            pw = str((await request.json()).get("password", ""))[:256]
        except Exception:
            pw = ""
        if not check_password(pw, stored):
            return JSONResponse({"ok": False}, status_code=401)
        resp = JSONResponse({"ok": True})
        resp.set_cookie(ADMIN_COOKIE, sign_token({"aud": "admin"}, admin_secret, 12 * 3600), max_age=12 * 3600,
                        httponly=True, secure=True, samesite="strict", path="/api/twin/admin")
        return resp

    @router.post("/admin/logout")
    async def admin_logout():
        resp = JSONResponse({"ok": True})
        resp.delete_cookie(ADMIN_COOKIE, path="/api/twin/admin")
        return resp

    @router.get("/admin/insights")
    async def admin_insights(request: Request, days: int = 7):
        if verify_token(request.cookies.get(ADMIN_COOKIE), admin_secret, "admin") is None:
            return JSONResponse({"ok": False}, status_code=401)
        gate: Gate = state["gate"]
        days = max(1, min(days, 90))
        today = datetime.now(DHAKA)
        rows, spend = [], []
        for i in range(days):
            d = dhaka_day(today - timedelta(days=i))
            raw = await asyncio.to_thread(gate.backend.read, f"log_{d}", 2000)
            rows += [json.loads(x) for x in raw]
            spend.append({"day": d, "usd": round(await asyncio.to_thread(gate.backend.get, f"spend_{d}"), 4)})
        qs = Counter(r["q"].strip().lower()[:120] for r in rows if r.get("q"))
        unanswered = [r for r in rows if r.get("unanswered")]
        lat = sorted(r.get("ms", 0) for r in rows) or [0]
        return {
            "ok": True,
            "days": days,
            "conversations": len(rows),
            "languages": Counter(r.get("lang", "?") for r in rows),
            "top_questions": qs.most_common(20),
            "unanswered": [{"q": r["q"], "at": r.get("at")} for r in unanswered[:50]],
            "latency_ms": {"p50": lat[len(lat) // 2], "p95": lat[int(len(lat) * 0.95) - 1 if len(lat) > 1 else 0]},
            "spend": spend,
            "logging": logging_on,
        }

    @router.post("/chat")
    async def chat(request: Request):
        if not session_ok(request):
            return JSONResponse({"kind": "session_required"}, status_code=401)
        try:
            body = ChatIn.model_validate(await request.json())
            image = body.image.decode() if body.image else None
            audio = body.audio.decode() if body.audio else None
            if (image and not _magic_ok(*image)) or (audio and not _magic_ok(*audio)):
                raise ValueError("content does not match declared type")
        except Exception:
            return JSONResponse(error_event("bad_request"), status_code=400)

        gate: Gate = state["gate"]
        verdict = await asyncio.to_thread(gate.admit, client_ip(request.headers))

        async def stream() -> AsyncIterator[bytes]:
            if not verdict.ok:
                yield sse(error_event(verdict.kind or "rate_limited", verdict.retry_after_s))
                return
            meter = CostMeter()
            deps = Deps(llm=get_llm(), knowledge=state["knowledge"], meter=meter)
            deps.started = deps.clock()
            graph = build_graph(deps)
            inputs = {
                "message": body.message,
                "history": [t.model_dump() for t in body.history[-12:]],
                "reply_to": body.reply_to.model_dump() if body.reply_to else None,
                "lang_override": None if body.lang == "auto" else body.lang,
                "image": image,
                "audio": audio,
            }
            final_box: dict = {}
            queue: asyncio.Queue = asyncio.Queue()

            async def run() -> None:
                final = None
                try:
                    async for mode, chunk in graph.astream(inputs, stream_mode=["custom", "values"]):
                        if mode == "custom":
                            await queue.put(("event", chunk))
                        elif mode == "values" and chunk.get("final"):
                            final = chunk["final"]
                except Exception:
                    # Surface graph failures immediately instead of letting the stream wait for the timeout.
                    log.exception("graph failed")
                    final = None
                await queue.put(("final", final))

            task = asyncio.create_task(run())
            try:
                async with asyncio.timeout(REQUEST_TIMEOUT_S):
                    while True:
                        kind, item = await queue.get()
                        if kind == "event":
                            yield sse(item)
                            continue
                        if not item:
                            yield sse(error_event("upstream_unavailable"))
                            break
                        final_box["final"] = item
                        yield sse({"v": 1, "type": "meta", "lang": item["lang"]})
                        for piece in chunk_text(item["text"]):
                            yield sse({"v": 1, "type": "token", "text": piece})
                        yield sse(item)
                        break
            except TimeoutError:
                yield sse(error_event("timeout"))
            except Exception:
                log.exception("chat failed")
                yield sse(error_event("upstream_unavailable"))
            finally:
                task.cancel()
                # Spend is recorded even when the client aborts or the cap fires (eng D12).
                try:
                    await asyncio.to_thread(gate.record_spend, meter)
                except Exception:
                    log.exception("record_spend failed")
                ms = int(deps.elapsed() * 1000)
                log.info(json.dumps({"evt": "chat", "usd": round(meter.usd, 6), "calls": len(meter.calls), "ms": ms}))
                f = final_box.get("final")
                if logging_on and f:
                    # Phase 4: question + answer only, 90-day TTL, no IP, disclosed in the chat (design 2A / R1-11).
                    record = {
                        "at": int(time.time()), "q": (body.message or "(voice/image)")[:500], "a": f["text"][:1500],
                        "lang": f["lang"], "ms": ms, "usd": round(meter.usd, 5), "sources": len(f["sources"]),
                        "unanswered": bool(f["trace"]["critic"].get("fallback")) or f.get("card") == "contact" and not f["sources"],
                        "media": "image" if image else ("audio" if audio else None),
                    }
                    try:
                        await asyncio.to_thread(log_turn, gate.backend, record)
                    except Exception:
                        log.exception("log_turn failed")

        return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # Same routes at /api/twin/* (Vercel passes the original path) and at the root (local uvicorn).
    app.include_router(router, prefix="/api/twin")
    app.include_router(router)
    return app


# Vercel entrypoint `app.api:app` / `uvicorn app.api:app`. Built at import so startup checks fail fast.
app = create_app() if os.environ.get("TWIN_SKIP_APP_IMPORT") != "1" else None
