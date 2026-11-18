"""LLM client boundary. Production uses Gemini on Vertex AI; tests inject FakeLLM.

Every call reports token usage to the request's CostMeter so the spend cap
counts every model call (guard, plan, draft, critic, and later embeddings,
transliteration and judge calls).
"""

from __future__ import annotations

import json
import os
from typing import Any, Protocol

from app.gate import CostMeter


THINKING_BUDGET = {"draft": int(os.environ.get("TWIN_DRAFT_THINKING", "512"))}


class LLM(Protocol):
    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter) -> dict: ...


class LLMParseError(RuntimeError):
    pass


class GeminiLLM:
    """google-genai client in Vertex mode (auth = Cloud Run runtime service account)."""

    def __init__(self, fast_model: str, main_model: str) -> None:
        from google import genai

        self._client = genai.Client(
            vertexai=True,
            project=os.environ.get("GCP_PROJECT_ID"),
            location=os.environ.get("GCP_LOCATION", "us-central1"),
        )
        self.models = {"fast": fast_model, "main": main_model}

    def model_for(self, role: str) -> str:
        return self.models["main"] if role == "draft" else self.models["fast"]

    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter) -> dict:
        from google.genai import types

        model = self.model_for(role)
        # Gemini 2.5 thinking tokens count against max_output_tokens: with thinking on, short
        # budgets truncate the JSON (seen live: critic verdict cut off → fail-closed on a good answer)
        # and add seconds of latency. Classify/plan/critic don't need it; the draft gets a small budget.
        thinking = THINKING_BUDGET.get(role, 0)
        resp = await self._client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2 if role != "draft" else 0.5,
                max_output_tokens=2048 + thinking,
                thinking_config=types.ThinkingConfig(thinking_budget=thinking),
            ),
        )
        um = resp.usage_metadata
        meter.add(model, getattr(um, "prompt_token_count", 0) or 0, getattr(um, "candidates_token_count", 0) or 0)
        try:
            return json.loads(resp.text or "")
        except (json.JSONDecodeError, TypeError) as exc:
            raise LLMParseError(f"{role}: model returned non-JSON") from exc


class FakeLLM:
    """Scripted LLM for tests. `script` maps role -> list of responses (dict or Exception)."""

    def __init__(self, script: dict[str, list[Any]], model: str = "gemini-2.5-flash") -> None:
        self.script = {k: list(v) for k, v in script.items()}
        self.calls: list[tuple[str, str]] = []
        self.model = model

    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter) -> dict:
        self.calls.append((role, prompt))
        meter.add(self.model, 1000, 100)
        queue = self.script.get(role) or []
        if not queue:
            raise AssertionError(f"FakeLLM: no scripted response left for role {role!r}")
        item = queue.pop(0)
        if isinstance(item, Exception):
            raise item
        return item
