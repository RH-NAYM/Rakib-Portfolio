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
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator

from app.gate import CostMeter, Gate, check_startup, client_ip, gate_from_env
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


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE)
    history: list[TurnIn] = Field(default_factory=list, max_length=40)
    reply_to: TurnIn | None = None
    lang: Literal["auto", "en", "bn", "banglish"] = "auto"


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

    @router.get("/healthz")
    async def healthz() -> dict:
        return {"ok": True, "docs": len(state["knowledge"].docs)}

    @router.post("/chat")
    async def chat(request: Request):
        try:
            body = ChatIn.model_validate(await request.json())
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
            }
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
                log.info(json.dumps({"evt": "chat", "usd": round(meter.usd, 6), "calls": len(meter.calls), "ms": int(deps.elapsed() * 1000)}))

        return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # Same routes at /api/twin/* (Vercel passes the original path) and at the root (local uvicorn).
    app.include_router(router, prefix="/api/twin")
    app.include_router(router)
    return app


# Vercel entrypoint `app.api:app` / `uvicorn app.api:app`. Built at import so startup checks fail fast.
app = create_app() if os.environ.get("TWIN_SKIP_APP_IMPORT") != "1" else None
