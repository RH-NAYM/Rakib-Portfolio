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


Media = tuple[bytes, str]  # (data, mime type)


class LLM(Protocol):
    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter, media: list[Media] | None = None) -> dict: ...

    async def speech(self, text: str, voice: str, meter: CostMeter) -> bytes: ...


class LLMParseError(RuntimeError):
    pass


def make_genai_client():
    """Gemini client from Vercel env (all-Vercel decision, D17).

    Order: GOOGLE_SERVICE_ACCOUNT_B64 (Vertex, recommended) → GOOGLE_APPLICATION_CREDENTIALS
    (Vertex, local key file / CI) → GEMINI_API_KEY (Gemini Developer API).
    """
    import base64

    from google import genai

    project = os.environ.get("GCP_PROJECT_ID")
    location = os.environ.get("GCP_LOCATION", "global")
    b64 = os.environ.get("GOOGLE_SERVICE_ACCOUNT_B64")
    if b64:
        from google.oauth2 import service_account

        info = json.loads(base64.b64decode(b64).decode("utf-8"))
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        return genai.Client(vertexai=True, project=project or info.get("project_id"), location=location, credentials=creds)
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return genai.Client(vertexai=True, project=project, location=location)
    if os.environ.get("GEMINI_API_KEY"):
        return genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    raise RuntimeError("No Gemini credentials: set GOOGLE_SERVICE_ACCOUNT_B64 (Vertex) or GEMINI_API_KEY.")


class GeminiLLM:
    """google-genai client; Vertex when service-account creds are present, else Developer API."""

    def __init__(self, fast_model: str, main_model: str) -> None:
        self._client = make_genai_client()
        self.models = {"fast": fast_model, "main": main_model}

    def model_for(self, role: str) -> str:
        return self.models["main"] if role == "draft" else self.models["fast"]

    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter, media: list[Media] | None = None) -> dict:
        from google.genai import types

        model = self.model_for(role)
        contents: Any = prompt
        if media:
            contents = [types.Part.from_bytes(data=d, mime_type=m) for d, m in media] + [prompt]
        # Gemini 2.5 thinking tokens count against max_output_tokens: with thinking on, short
        # budgets truncate the JSON (seen live: critic verdict cut off → fail-closed on a good answer)
        # and add seconds of latency. Classify/plan/critic don't need it; the draft gets a small budget.
        thinking = THINKING_BUDGET.get(role, 0)
        resp = await self._client.aio.models.generate_content(
            model=model,
            contents=contents,
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


    async def speech(self, text: str, voice: str, meter: CostMeter) -> bytes:
        """Gemini TTS → 16-bit mono 24 kHz PCM, wrapped as WAV for the browser."""
        from google.genai import types

        model = os.environ.get("TWIN_TTS_MODEL", "gemini-2.5-flash-preview-tts")
        resp = await self._client.aio.models.generate_content(
            model=model,
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice))
                ),
            ),
        )
        um = resp.usage_metadata
        meter.add(model, getattr(um, "prompt_token_count", 0) or 0, getattr(um, "candidates_token_count", 0) or 0)
        pcm = resp.candidates[0].content.parts[0].inline_data.data
        return pcm_to_wav(pcm)


def pcm_to_wav(pcm: bytes, rate: int = 24000) -> bytes:
    import struct

    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
    return header + b"data" + struct.pack("<I", len(pcm)) + pcm


class FakeLLM:
    """Scripted LLM for tests. `script` maps role -> list of responses (dict or Exception)."""

    def __init__(self, script: dict[str, list[Any]], model: str = "gemini-2.5-flash") -> None:
        self.script = {k: list(v) for k, v in script.items()}
        self.calls: list[tuple[str, str]] = []
        self.media_seen: list[Media] = []
        self.model = model

    async def json(self, role: str, system: str, prompt: str, schema: dict, meter: CostMeter, media: list[Media] | None = None) -> dict:
        self.calls.append((role, prompt))
        self.media_seen.extend(media or [])
        meter.add(self.model, 1000, 100)
        queue = self.script.get(role) or []
        if not queue:
            raise AssertionError(f"FakeLLM: no scripted response left for role {role!r}")
        item = queue.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    async def speech(self, text: str, voice: str, meter: CostMeter) -> bytes:
        self.calls.append(("speech", f"{voice}:{text}"))
        meter.add(self.model, 100, 1000)
        return pcm_to_wav(b"\x00\x00" * 2400)
