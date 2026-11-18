"""Vertex AI price table used by the daily spend cap (eng review: refuse to start
if a configured model has no price row, so spend can never count as $0).

USD per 1M tokens (input, output). Verify against the Vertex AI pricing page
whenever TWIN_MODEL_* changes; this table is the only place prices live.
"""

PRICES_PER_M: dict[str, tuple[float, float]] = {
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.5-pro": (1.25, 10.00),
    "gemini-embedding-001": (0.15, 0.0),
    # TTS: output is audio tokens. Verify against current Vertex/Gemini pricing before launch.
    "gemini-2.5-flash-preview-tts": (0.50, 10.00),
    "gemini-2.5-flash-tts": (0.50, 10.00),
}


def cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    inp, out = PRICES_PER_M[model]
    return (input_tokens * inp + output_tokens * out) / 1_000_000


def assert_priced(*models: str) -> None:
    missing = [m for m in models if m not in PRICES_PER_M]
    if missing:
        raise RuntimeError(f"No price row for model(s) {missing}; add them to app/pricing.py before deploying.")
