from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from tools import MyTools
from pathlib import Path
import markdown
import aiofiles

app = FastAPI(title="AI Portfolio")

__tools__ = MyTools()

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


PORTFOLIO_DATA = __tools__.load_data("static/utils").get("merge_data", None)


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "data": PORTFOLIO_DATA}
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





