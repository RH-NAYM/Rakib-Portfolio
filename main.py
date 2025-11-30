"""
Principal AI Engineer Portfolio - FastAPI Backend
Single-page architecture with CMS-ready data structures
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="Principal AI Engineer Portfolio",
    description="Production AI Systems | Scale | Reliability",
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="templates")

# CMS-Ready Data Structures
BLOG_POSTS = [
    {
        "id": 1,
        "slug": "distributed-inference-at-scale",
        "title": "Distributed Inference at Scale: Lessons from Production",
        "excerpt": "Engineering reliable inference systems that handle millions of requests while maintaining sub-100ms latency requires careful attention to batching strategies, model sharding, and failure recovery.",
        "date": "2025-11-15",
        "category": "Systems Architecture",
        "read_time": "12 min"
    },
    {
        "id": 2,
        "slug": "reliability-patterns-ml-systems",
        "title": "Reliability Patterns for Mission-Critical ML Systems",
        "excerpt": "When your ML system powers critical infrastructure, traditional software reliability patterns must be augmented with model-specific considerations including drift detection and automated rollback.",
        "date": "2025-10-28",
        "category": "Reliability Engineering",
        "read_time": "15 min"
    },
    {
        "id": 3,
        "slug": "vector-search-optimization",
        "title": "Vector Search Optimization: Beyond HNSW",
        "excerpt": "Approximate nearest neighbor search at billion-scale requires understanding the trade-offs between indexing strategies, memory hierarchies, and query patterns.",
        "date": "2025-10-10",
        "category": "Performance",
        "read_time": "18 min"
    },
    {
        "id": 4,
        "slug": "llm-serving-infrastructure",
        "title": "LLM Serving Infrastructure: A Systems Perspective",
        "excerpt": "Deploying large language models in production environments demands sophisticated approaches to KV-cache management, continuous batching, and speculative decoding.",
        "date": "2025-09-22",
        "category": "Infrastructure",
        "read_time": "20 min"
    }
]

PROJECTS = [
    {
        "id": 1,
        "slug": "distributed-inference-engine",
        "title": "Distributed Inference Engine",
        "domain": "ML Infrastructure",
        "description": "High-throughput inference orchestration system handling 50M+ daily predictions across heterogeneous GPU clusters with automatic failover and load balancing.",
        "tech": ["Python", "CUDA", "gRPC", "Kubernetes", "Ray"],
        "metrics": "99.99% uptime, p99 latency < 45ms"
    },
    {
        "id": 2,
        "slug": "realtime-anomaly-detection",
        "title": "Real-Time Anomaly Detection Pipeline",
        "domain": "Streaming Systems",
        "description": "Sub-millisecond anomaly detection system processing 2M+ events/second with adaptive thresholding and automated model retraining triggers.",
        "tech": ["Kafka", "Flink", "PyTorch", "TimescaleDB"],
        "metrics": "< 500μs detection latency, 0.01% FPR"
    },
    {
        "id": 3,
        "slug": "vector-search-platform",
        "title": "Billion-Scale Vector Search Platform",
        "domain": "Search Infrastructure",
        "description": "Custom ANN search infrastructure supporting 3B+ vectors with hybrid sparse-dense retrieval and real-time index updates.",
        "tech": ["Rust", "FAISS", "ScaNN", "Redis", "PostgreSQL"],
        "metrics": "< 10ms p99, 95% recall@10"
    },
    {
        "id": 4,
        "slug": "llm-orchestration-framework",
        "title": "LLM Orchestration Framework",
        "domain": "GenAI Systems",
        "description": "Production framework for deploying and orchestrating multiple LLMs with intelligent routing, caching, and cost optimization.",
        "tech": ["Python", "vLLM", "TensorRT-LLM", "Triton"],
        "metrics": "40% cost reduction, 3x throughput"
    },
    {
        "id": 5,
        "slug": "ml-feature-platform",
        "title": "ML Feature Platform",
        "domain": "Data Infrastructure",
        "description": "Unified feature store supporting both batch and real-time feature computation with point-in-time correctness.",
        "tech": ["Spark", "Feast", "Redis", "Delta Lake", "Airflow"],
        "metrics": "10K+ features, < 5ms serving latency"
    },
    {
        "id": 6,
        "slug": "model-observability-system",
        "title": "Model Observability System",
        "domain": "MLOps",
        "description": "Comprehensive observability platform providing real-time drift detection, performance monitoring, and automated alerting.",
        "tech": ["Prometheus", "Grafana", "EvidentlyAI", "Great Expectations"],
        "metrics": "< 30min drift detection, 99.9% alert accuracy"
    }
]


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main single-page portfolio"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Principal AI Engineer | Production AI Systems",
        "description": "Building mission-critical AI systems that operate at scale with reliability and precision.",
        "projects": PROJECTS,
        "posts": BLOG_POSTS
    })


@app.get("/blog/{slug}", response_class=HTMLResponse)
async def blog_post(request: Request, slug: str):
    """Individual blog post page"""
    post = next((p for p in BLOG_POSTS if p["slug"] == slug), None)
    return templates.TemplateResponse("demo.html", {
        "request": request,
        "title": f"{post['title'] if post else 'Article'} | Principal AI Engineer",
        "description": post["excerpt"] if post else "Technical article",
        "content_type": "blog",
        "item": post
    })


@app.get("/project/{slug}", response_class=HTMLResponse)
async def project_detail(request: Request, slug: str):
    """Individual project detail page"""
    project = next((p for p in PROJECTS if p["slug"] == slug), None)
    return templates.TemplateResponse("demo.html", {
        "request": request,
        "title": f"{project['title'] if project else 'Project'} | Principal AI Engineer",
        "description": project["description"] if project else "Technical project",
        "content_type": "project",
        "item": project
    })
