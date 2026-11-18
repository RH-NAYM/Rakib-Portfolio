"""Build the twin's knowledge corpus (twin-agent/data/corpus.json).

Phase 1a uses full-context answering (eng review D7): every document goes into
the prompt, so this script only normalises sources into titled documents with
stable ids, urls and text. Hybrid retrieval is added later only if the golden
eval shows full-context loses.

Sources (repo-relative):
  twin-agent/data/site.json          <- scripts/export-content.ts (src/content/*)
  public/Rakibul_Hasan_Naym_CV.pdf   CV
  Rakibul_Hasan_Naym_Project_Portfolio.docx
  content/blog/*.mdx                 (files starting with "_" are skipped)
  content/twin/notes.md              first-person Q&A written by Rakib
  content/twin/media.yaml            screenshot catalog (embedded in corpus.json "media"; used by show_media)
  GitHub READMEs                     only when TWIN_FETCH_READMES=1 (needs network; GITHUB_TOKEN optional)

Run: python -m ingest.build_corpus   (from twin-agent/)
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AGENT_DIR.parent
DATA_DIR = AGENT_DIR / "data"


def _doc(doc_id: str, title: str, url: str, kind: str, text: str) -> dict:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return {"id": doc_id, "title": title, "url": url, "kind": kind, "text": text}


def site_docs(site: dict) -> list[dict]:
    base = site["siteUrl"]
    p = site["profile"]
    docs = [
        _doc(
            "profile",
            "Profile & about",
            f"{base}/#about",
            "site",
            "\n".join(
                [
                    f"Name: {p['name']} ({p['shortName']})",
                    f"Title: {p['title']} at {p['company']}",
                    f"Location: {p['location']}",
                    f"Availability: {p['availability']}",
                    f"Email: {p['email']}",
                    f"Positioning: {p['positioning']}",
                    f"Languages: {site['languages']}",
                    "Headline metrics: " + "; ".join(f"{m['value']} {m['label']}" for m in site["metrics"]),
                    "",
                    *site["about"],
                ]
            ),
        ),
        _doc(
            "skills",
            "Skills",
            f"{base}/#skills",
            "site",
            "\n".join(f"{g['title']} ({g['note']}): {', '.join(g['items'])}" for g in site["skillGroups"]),
        ),
        _doc(
            "education",
            "Education & recognition",
            f"{base}/#about",
            "site",
            "\n".join(
                [
                    f"{site['education']['degree']}, {site['education']['institution']}, {site['education']['year']}, {site['education']['cgpa']}",
                    *site["recognition"],
                ]
            ),
        ),
        _doc(
            "services",
            "Freelance services",
            f"{base}/#services",
            "site",
            "\n".join(f"{s['title']} (from {s['from']}): {s['blurb']}" for s in site["services"]),
        ),
        _doc(
            "socials",
            "Links",
            f"{base}/#contact",
            "site",
            "\n".join(f"{v['label']}: {v['url']}" for v in site["socials"].values()),
        ),
    ]
    for i, e in enumerate(site["experience"]):
        lines = [f"{e['org']} — {e['location']} ({e['period']}, {e['duration']})"]
        for r in e["roles"]:
            lines.append(f"Role: {r['title']} ({r['period']})")
            lines += [f"- {b}" for b in r["bullets"]]
            if r.get("stack"):
                lines.append("Stack: " + ", ".join(r["stack"]))
        docs.append(_doc(f"exp-{i}", f"Experience · {e['org']}", f"{base}/#experience", "site", "\n".join(lines)))
    for cs in site["caseStudies"]:
        lines = [
            cs["title"],
            cs["subtitle"],
            f"Context: {cs['context']}",
            f"Domain: {cs['domain']}",
            "Metrics: " + "; ".join(f"{m['value']} {m['label']}" for m in cs["metrics"]),
            f"Problem: {cs['problem']}",
            "Approach:",
            *[f"- {a}" for a in cs["approach"]],
            "Pipeline: " + " → ".join(cs["architecture"]["pipeline"]),
            "Stack: " + ", ".join(cs["architecture"]["stack"]),
            "Results:",
            *[f"- {r['text']}" for r in cs["results"]],
        ]
        docs.append(_doc(f"case-{cs['slug']}", f"Case study · {cs['title']}", f"{base}/work/{cs['slug']}", "case_study", "\n".join(lines)))
    repo_lines = [f"- {r['name']} [{r['domain']}]: {r['description']} ({', '.join(r['tags'])}) {r['url']}" for r in site["repos"]]
    docs.append(_doc("repos", "Repository index", f"{base}/projects", "site", "\n".join(repo_lines)))
    return docs


def pdf_doc(path: Path) -> dict | None:
    if not path.exists():
        return None
    from pypdf import PdfReader

    text = "\n".join((pg.extract_text() or "") for pg in PdfReader(str(path)).pages)
    return _doc("cv", "CV (PDF)", "/Rakibul_Hasan_Naym_CV.pdf", "cv", text)


def docx_doc(path: Path, doc_id: str, title: str) -> dict | None:
    if not path.exists():
        return None
    from docx import Document

    d = Document(str(path))
    parts = [p.text for p in d.paragraphs if p.text.strip()]
    for t in d.tables:
        for row in t.rows:
            parts.append(" | ".join(c.text.strip() for c in row.cells))
    return _doc(doc_id, title, "", "doc", "\n".join(parts))


def blog_docs(base_url: str) -> list[dict]:
    out = []
    for f in sorted((REPO_ROOT / "content" / "blog").glob("*.mdx")):
        if f.name.startswith("_"):
            continue
        raw = f.read_text(encoding="utf-8")
        title = f.stem
        m = re.match(r"^---\n(.*?)\n---\n", raw, re.S)
        if m:
            tm = re.search(r"^title:\s*[\"']?(.+?)[\"']?\s*$", m.group(1), re.M)
            if tm:
                title = tm.group(1)
            raw = raw[m.end():]
        out.append(_doc(f"blog-{f.stem}", f"Blog · {title}", f"{base_url}/blog/{f.stem}", "blog", raw))
    return out


def notes_doc(base_url: str) -> dict | None:
    f = REPO_ROOT / "content" / "twin" / "notes.md"
    if not f.exists():
        return None
    return _doc("notes", "My notes (Q&A)", f"{base_url}/#about", "notes", f.read_text(encoding="utf-8"))


def readme_docs(repos: list[dict]) -> list[dict]:
    if os.environ.get("TWIN_FETCH_READMES") != "1":
        return []
    token = os.environ.get("GITHUB_TOKEN")
    out = []
    for r in repos:
        m = re.match(r"https://github\.com/([^/]+)/([^/]+)", r["url"])
        if not m:
            continue
        req = urllib.request.Request(
            f"https://api.github.com/repos/{m.group(1)}/{m.group(2)}/readme",
            headers={"Accept": "application/vnd.github.raw", **({"Authorization": f"Bearer {token}"} if token else {})},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                text = resp.read().decode("utf-8", "replace")[:12000]
        except Exception as exc:  # README missing or rate-limited: skip, never fail the build
            print(f"readme skip {r['name']}: {exc}", file=sys.stderr)
            continue
        out.append(_doc(f"readme-{r['name']}", f"README · {r['name']}", r["url"], "readme", text))
    return out


def build() -> list[dict]:
    site = json.loads((DATA_DIR / "site.json").read_text(encoding="utf-8"))
    base = site["siteUrl"]
    docs = site_docs(site)
    for d in (
        pdf_doc(REPO_ROOT / "public" / "Rakibul_Hasan_Naym_CV.pdf"),
        docx_doc(REPO_ROOT / "Rakibul_Hasan_Naym_Project_Portfolio.docx", "portfolio-doc", "Project portfolio (doc)"),
        notes_doc(base),
    ):
        if d and d["text"]:
            docs.append(d)
    docs += blog_docs(base)
    docs += readme_docs(site["repos"])
    ids = [d["id"] for d in docs]
    assert len(ids) == len(set(ids)), "duplicate doc ids"
    return docs


def main() -> None:
    docs = build()
    out = DATA_DIR / "corpus.json"
    import yaml

    media_file = REPO_ROOT / "content" / "twin" / "media.yaml"
    media = (yaml.safe_load(media_file.read_text(encoding="utf-8")) or []) if media_file.exists() else []
    out.write_text(json.dumps({"version": 1, "docs": docs, "media": media}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    chars = sum(len(d["text"]) for d in docs)
    print(f"wrote {out}: {len(docs)} docs, {chars} chars (~{chars // 4} tokens)")


if __name__ == "__main__":
    main()
