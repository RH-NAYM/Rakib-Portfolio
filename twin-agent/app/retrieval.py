"""Knowledge access. Phase 1a is full-context (eng D7): the whole corpus goes in
the draft prompt, ordered stably so Gemini's implicit prefix cache can hit.
`show_media` only ever returns catalog entries; the model cannot invent URLs.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

import yaml

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AGENT_DIR.parent


@dataclass(frozen=True)
class Doc:
    id: str
    title: str
    url: str
    kind: str
    text: str


@dataclass(frozen=True)
class MediaItem:
    id: str
    src: str
    project_slug: str
    caption: str
    alt: str
    tags: tuple[str, ...]


class Knowledge:
    def __init__(self, docs: list[Doc], media: list[MediaItem], site_url: str = "") -> None:
        self.docs = docs
        self.by_id = {d.id: d for d in docs}
        self.media = media
        self.site_url = site_url
        self._block = "\n\n".join(
            f'<doc id="{d.id}" title="{d.title}">\n{d.text}\n</doc>' for d in docs
        )

    @classmethod
    def load(cls, corpus_path: Path | None = None, media_path: Path | None = None) -> "Knowledge":
        corpus_path = corpus_path or AGENT_DIR / "data" / "corpus.json"
        media_path = media_path or Path(os.environ.get("TWIN_MEDIA_PATH", REPO_ROOT / "content" / "twin" / "media.yaml"))
        raw = json.loads(corpus_path.read_text(encoding="utf-8"))
        docs = [Doc(**{k: d[k] for k in ("id", "title", "url", "kind", "text")}) for d in raw["docs"]]
        media: list[MediaItem] = []
        # The catalog is embedded in corpus.json at build time: on Vercel the twin service only
        # ships twin-agent/, so content/twin/media.yaml isn't there at runtime.
        entries = raw.get("media")
        if entries is None and media_path.exists():
            entries = yaml.safe_load(media_path.read_text(encoding="utf-8")) or []
        if entries:
            for m in entries:
                media.append(
                    MediaItem(
                        id=str(m["id"]),
                        src=str(m["src"]),
                        project_slug=str(m.get("project_slug", "")),
                        caption=str(m.get("caption", "")),
                        alt=str(m.get("alt", m.get("caption", ""))),
                        tags=tuple(str(t).lower() for t in m.get("tags", [])),
                    )
                )
        site_url = ""
        site_json = AGENT_DIR / "data" / "site.json"
        if site_json.exists():
            site_url = json.loads(site_json.read_text(encoding="utf-8")).get("siteUrl", "")
        return cls(docs, media, site_url)

    def corpus_block(self) -> str:
        return self._block

    def show_media(self, query: str, limit: int = 4) -> list[MediaItem]:
        words = {w for w in re.findall(r"[a-z0-9-]+", query.lower()) if len(w) > 2}
        if not words:
            return []
        scored = []
        for m in self.media:
            hay = set(re.findall(r"[a-z0-9-]+", " ".join([m.project_slug, m.caption.lower(), *m.tags])))
            score = len(words & hay)
            if score:
                scored.append((score, m))
        scored.sort(key=lambda x: -x[0])
        return [m for _, m in scored[:limit]]
