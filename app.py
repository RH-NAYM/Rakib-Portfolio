import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import markdown
import aiofiles
import dotenv

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from tools import MyTools
from ai_assistant.agent import get_ai_response, sanitize_input
from ai_assistant.session_store import session_store

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate AI provider keys on startup."""
    groq_key = os.getenv("GROQ_API_KEY")
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    if groq_key:
        logger.info("✅ Rakibul AI: Groq API key found (primary provider)")
    else:
        logger.warning("⚠️  Rakibul AI: No GROQ_API_KEY — will fall back to Ollama")

    logger.info(f"✅ Rakibul AI: Ollama fallback → {ollama_host} (model: {os.getenv('OLLAMA_MODEL', 'qwen2.5')})")

    if not groq_key:
        logger.warning("⚠️  Rakibul AI: No Groq key — will fall back to Ollama if available")

    yield
    logger.info("Rakibul Portfolio shutting down.")


app = FastAPI(title="AI Portfolio", lifespan=lifespan)

__tools__ = MyTools()

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

PORTFOLIO_DATA = __tools__.load_data("static/utils").get("merge_data", None)


# ── Existing Routes ───────────────────────────────────────────────────────────

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"data": PORTFOLIO_DATA}
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/articles/{filename}", response_class=HTMLResponse)
async def read_article(filename: str):
    path = Path("static/articles") / filename
    if not path.exists():
        return HTMLResponse(content="Article not found", status_code=404)

    async with aiofiles.open(path, "r") as f:
        content = await f.read()

    html_content = markdown.markdown(content)
    return HTMLResponse(content=html_content)


# ── Rakibul AI Routes ─────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(..., min_length=36, max_length=36)


class SessionCreateResponse(BaseModel):
    session_id: str


class ChatResponse(BaseModel):
    response: str
    provider: str
    session_id: str


@app.post("/api/chat/session", response_model=SessionCreateResponse)
async def create_chat_session():
    """Create a new chat session. Call once when the widget opens."""
    session_id = session_store.create_session()
    return {"session_id": session_id}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request_data: ChatRequest):
    """Main chat endpoint — accepts message + session_id, returns AI response."""
    session_id = request_data.session_id

    if not session_store.session_exists(session_id):
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Please refresh the chat."
        )

    user_message = sanitize_input(request_data.message)
    if not user_message:
        raise HTTPException(status_code=400, detail="Empty message after sanitization.")

    history = session_store.get_history(session_id)

    result = await get_ai_response(
        user_message=user_message,
        history=history,
    )

    ai_response = result["response"]
    provider = result["provider"]

    session_store.add_message(session_id, "user", user_message)
    session_store.add_message(session_id, "assistant", ai_response)

    return {
        "response": ai_response,
        "provider": provider,
        "session_id": session_id,
    }


@app.get("/api/chat/health")
async def chat_health():
    """Health check for the Rakibul AI subsystem."""
    stats = session_store.stats()
    return {
        "status": "ok" if (os.getenv("GROQ_API_KEY") or os.getenv("OLLAMA_HOST")) else "degraded",
        "groq_available": bool(os.getenv("GROQ_API_KEY")),
        "ollama_host": os.getenv("OLLAMA_HOST", "http://localhost:11434"),
        "ollama_model": os.getenv("OLLAMA_MODEL", "llama3.2"),
        **stats,
    }

































































# from fastapi import FastAPI, Request
# from fastapi.staticfiles import StaticFiles
# from fastapi.templating import Jinja2Templates
# from fastapi.responses import HTMLResponse
# from tools import MyTools
# from pathlib import Path
# import markdown
# import aiofiles

# app = FastAPI(title="AI Portfolio")

# __tools__ = MyTools()

# # Setup paths
# BASE_DIR = Path(__file__).resolve().parent
# app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
# templates = Jinja2Templates(directory=BASE_DIR / "templates")


# PORTFOLIO_DATA = __tools__.load_data("static/utils").get("merge_data", None)


# @app.get("/")
# async def home(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {"request": request, "data": PORTFOLIO_DATA}
#     )


# @app.get("/health")
# async def health():
#     return {"status": "healthy"}



# @app.get("/articles/{filename}", response_class=HTMLResponse)
# async def read_article(filename: str):
#     path = Path("static/articles") / filename
#     if not path.exists():
#         return HTMLResponse(content="Article not found", status_code=404)

#     async with aiofiles.open(path, "r") as f:
#         content = await f.read()
#     html_content = markdown.markdown(content)
#     return HTMLResponse(content=html_content)
















