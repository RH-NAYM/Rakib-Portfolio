"""
Rakibul AI Agent
Primary:  Groq (llama-3.3-70b-versatile) — sub-second cloud inference
Fallback: Ollama (local, free)           — runs on your own machine

Ollama setup:
  curl -fsSL https://ollama.com/install.sh | sh
  ollama pull qwen2.5
"""
import os
import logging
import aiohttp

from ai_assistant.system_prompt import RAKIBUL_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

GROQ_MODEL   = "llama-3.3-70b-versatile"
OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5")


# ── Message Builder ───────────────────────────────────────────────────────────

def _build_messages(history: list[dict], user_message: str) -> list[dict]:
    messages = [{"role": "system", "content": RAKIBUL_SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages


# ── Groq (Primary) ────────────────────────────────────────────────────────────

async def _call_groq(messages: list[dict]) -> str:
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            top_p=0.9,
        )
        return response.choices[0].message.content.strip()
    except ImportError:
        raise RuntimeError("groq package not installed. Run: pip install groq")
    except Exception as e:
        logger.warning(f"Groq call failed: {e}")
        raise


# ── Ollama (Fallback) ─────────────────────────────────────────────────────────

async def _call_ollama(messages: list[dict]) -> str:
    """
    Calls Ollama's OpenAI-compatible endpoint.
    Ollama must be running locally: `ollama serve`
    """
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 1024,
        },
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"Ollama returned {resp.status}: {text}")
                data = await resp.json()
                return data["message"]["content"].strip()
    except aiohttp.ClientConnectorError:
        raise RuntimeError(
            f"Cannot reach Ollama at {OLLAMA_HOST}. "
            "Is it running? Try: ollama serve"
        )
    except Exception as e:
        logger.error(f"Ollama call failed: {e}")
        raise


# ── Main Entry Point ──────────────────────────────────────────────────────────

async def get_ai_response(
    user_message: str,
    history: list[dict],
    use_fallback: bool = True,
) -> dict:
    """
    Get AI response with Groq → Ollama fallback chain.

    Returns:
        {"response": str, "provider": "groq"|"ollama"|"error", "error": str|None}
    """
    messages = _build_messages(history, user_message)

    # ── Try Groq first ──
    if os.getenv("GROQ_API_KEY"):
        try:
            text = await _call_groq(messages)
            return {"response": text, "provider": "groq", "error": None}
        except Exception as e:
            logger.warning(f"Groq failed, falling back to Ollama. Reason: {e}")

    # ── Fallback to Ollama ──
    if use_fallback:
        try:
            text = await _call_ollama(messages)
            return {"response": text, "provider": "ollama", "error": None}
        except Exception as e:
            logger.error(f"Ollama fallback failed: {e}")
            return {
                "response": "Both AI providers are currently unavailable. Please try again shortly.",
                "provider": "error",
                "error": str(e),
            }

    return {
        "response": "No AI provider configured. Set GROQ_API_KEY or start Ollama locally.",
        "provider": "error",
        "error": "No providers available",
    }


# ── Input Sanitization ────────────────────────────────────────────────────────

def sanitize_input(text: str, max_length: int = 2000) -> str:
    if not text or not isinstance(text, str):
        return ""
    return text.strip()[:max_length].replace("\x00", "")
