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
# # BASE_DIR = Path(__file__).resolve().parent
# BASE_DIR = Path.cwd() / "app"
# # app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
# app.mount("/static", StaticFiles(directory="public"), name="static")
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


# # @app.get("/articles/{filename}", response_class=HTMLResponse)
# # async def read_article(filename: str):
# #     path = BASE_DIR / "static" / "articles" / filename
# #     if not path.exists():
# #         return HTMLResponse(content="Article not found", status_code=404)
# #     content = path.read_text()
# #     html_content = markdown.markdown(content)
# #     return f"<html><body>{html_content}</body></html>"



# @app.get("/articles/{filename}", response_class=HTMLResponse)
# async def read_article(filename: str):
#     path = Path("public/articles") / filename
#     if not path.exists():
#         return HTMLResponse(content="Article not found", status_code=404)

#     async with aiofiles.open(path, "r") as f:
#         content = await f.read()
#     html_content = markdown.markdown(content)
#     return HTMLResponse(content=html_content)






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

# Correct paths
BASE_DIR = Path(__file__).resolve().parent.parent  # project root
PUBLIC_DIR = BASE_DIR / "public"
TEMPLATES_DIR = PUBLIC_DIR / "templates"

# Mount static files
app.mount("/static", StaticFiles(directory=PUBLIC_DIR), name="static")

# Templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Load portfolio data
PORTFOLIO_DATA = __tools__.load_data(PUBLIC_DIR / "utils").get("merge_data", None)


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
    path = PUBLIC_DIR / "articles" / filename
    if not path.exists():
        return HTMLResponse(content="Article not found", status_code=404)

    async with aiofiles.open(path, "r") as f:
        content = await f.read()
    html_content = markdown.markdown(content)
    return HTMLResponse(content=html_content)
