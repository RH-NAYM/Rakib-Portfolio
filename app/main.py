from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
# from fastapi.responses import FileResponse
from tools import MyTools
from pathlib import Path

app = FastAPI(title="AI Portfolio")

__tools__ = MyTools()

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


PORTFOLIO_DATA = __tools__.load_data("./utils").get("merge_data", None)


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "data": PORTFOLIO_DATA}
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}


# @app.get("/favicon.ico")
# async def favicon():
#     return FileResponse(BASE_DIR / "static" / "favicon.ico")
