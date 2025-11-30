from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from utils.tools import MyTools

__tools__ = MyTools()

app = FastAPI(
    title="Md. Rakibul Hasan Naym | Senior Manager AI Portfolio",
    description=(
        "Md. Rakibul Hasan Naym, Senior Manager AI, leads the design, deployment, and optimization of "
        "production-grade AI systems. Experienced in computer vision, NLP, real-time inference, and scalable "
        "AI infrastructure, delivering solutions that process millions of predictions daily with low latency "
        "and high reliability."
    ),
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="templates")

# CMS-Ready Data Structures
BLOG_POSTS = __tools__.load_data(data_dir="static/data").get("blogs", [])
PROJECTS = __tools__.load_data(data_dir="static/data").get("projects", [])


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main single-page portfolio"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Md. Rakibul Hasan Naym | Senior Manager AI",
        "description": (
            "I am Md. Rakibul Hasan Naym, Senior Manager AI, specializing in architecting and deploying "
            "mission-critical AI systems. I have led projects involving computer vision pipelines, NLP engines, "
            "and custom speech recognition systems, scaling to millions of predictions per day. "
            "Expert in asynchronous AI deployments, API integrations, and performance optimization, "
            "ensuring low-latency, high-reliability solutions that impact business operations globally."
        ),
        "projects": PROJECTS,
        "posts": BLOG_POSTS
    })


@app.get("/blog/{slug}", response_class=HTMLResponse)
async def blog_post(request: Request, slug: str):
    """Individual blog post page"""
    post = next((p for p in BLOG_POSTS if p["slug"] == slug), None)
    return templates.TemplateResponse("demo.html", {
        "request": request,
        "title": f"{post['title'] if post else 'Article'} | Md. Rakibul Hasan Naym, Senior Manager AI",
        "description": post["excerpt"] if post else (
            "Insights by Md. Rakibul Hasan Naym on building scalable AI systems, production-level "
            "model deployment, hyper-parameter optimization, real-time computer vision, NLP pipelines, "
            "and AI-driven business intelligence."
        ),
        "content_type": "blog",
        "item": post
    })


@app.get("/project/{slug}", response_class=HTMLResponse)
async def project_detail(request: Request, slug: str):
    """Individual project detail page"""
    project = next((p for p in PROJECTS if p["slug"] == slug), None)
    return templates.TemplateResponse("demo.html", {
        "request": request,
        "title": f"{project['title'] if project else 'Project'} | Md. Rakibul Hasan Naym, Senior Manager AI",
        "description": project["description"] if project else (
            "Showcasing high-impact AI projects led by Md. Rakibul Hasan Naym, including large-scale computer vision, "
            "NLP, and speech recognition systems. Each solution is optimized for production, ensuring high throughput, "
            "low latency, and measurable business outcomes."
        ),
        "content_type": "project",
        "item": project
    })
