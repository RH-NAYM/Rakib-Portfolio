from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

app = FastAPI(title="AI Portfolio")

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Portfolio data
PORTFOLIO_DATA = {
    "name": "Alexander Chen",
    "title": "Head of Artificial Intelligence",
    "tagline": "Building production AI systems that scale—from computer vision pipelines to enterprise-grade inference infrastructure.",
    "email": "alex.chen@example.com",
    "github": "https://github.com/alexchen-ai",
    "linkedin": "https://linkedin.com/in/alexchen-ai",
    "about": {
        "paragraphs": [
            "I architect and deploy AI systems that operate at scale. With over 12 years in machine learning and computer vision, I've led teams building production infrastructure that processes millions of predictions daily.",
            "My focus is on the intersection of research and production—translating cutting-edge models into reliable, cost-effective systems. I specialize in computer vision, real-time inference optimization, and building ML platforms that engineering teams can actually use.",
            "Currently leading AI strategy and technical direction for a team of 25+ ML engineers and researchers, with direct ownership of systems serving 50M+ daily active users."
        ]
    },
    "expertise": [
        {
            "domain": "AI System Architecture",
            "description": "Designing end-to-end ML platforms with focus on reliability, observability, and team velocity. Event-driven architectures, feature stores, model registries.",
            "icon": "◆"
        },
        {
            "domain": "Computer Vision Pipelines",
            "description": "Production vision systems for detection, segmentation, OCR, and video analytics. Real-time processing at scale with sub-100ms latency requirements.",
            "icon": "◇"
        },
        {
            "domain": "Model Deployment & Optimization",
            "description": "ONNX, TensorRT, quantization, pruning, and distillation. Taking models from notebook to production with 10x inference speedups.",
            "icon": "○"
        },
        {
            "domain": "GPU-Accelerated Inference",
            "description": "CUDA optimization, multi-GPU serving, batching strategies. Building inference infrastructure that maximizes hardware utilization.",
            "icon": "□"
        },
        {
            "domain": "Asynchronous & Scalable Processing",
            "description": "High-throughput async pipelines, message queues, distributed processing. Systems handling 100K+ requests per second.",
            "icon": "△"
        },
        {
            "domain": "Technical Leadership",
            "description": "Building and scaling ML teams, defining technical roadmaps, stakeholder communication, and translating business needs into technical strategy.",
            "icon": "▽"
        }
    ],
    "projects": [
        {
            "title": "Real-Time Defect Detection System",
            "problem": "Manufacturing client losing $2M annually to undetected product defects. Existing manual inspection caught only 73% of defects with 8-hour detection delay.",
            "solution": "Built end-to-end computer vision pipeline with custom object detection models, edge deployment on NVIDIA Jetson devices, and real-time alerting system. Implemented active learning loop for continuous model improvement.",
            "impact": "99.2% defect detection rate. Reduced detection time from 8 hours to 200ms. $1.8M annual savings. System processes 50K units daily.",
            "stack": ["PyTorch", "TensorRT", "NVIDIA Jetson", "FastAPI", "Redis", "PostgreSQL"]
        },
        {
            "title": "Document Intelligence Platform",
            "problem": "Financial services firm processing 500K documents monthly with 40-person manual review team. 72-hour average processing time per document batch.",
            "solution": "Architected multi-model pipeline combining OCR, NER, and classification. Built custom transformer models for domain-specific entity extraction. Implemented human-in-the-loop validation for edge cases.",
            "impact": "85% reduction in manual review time. Processing time reduced to 4 hours. Team reallocated to higher-value analysis. Platform now licensed to 3 additional enterprises.",
            "stack": ["Transformers", "Tesseract", "spaCy", "Kubernetes", "Apache Kafka", "ElasticSearch"]
        },
        {
            "title": "Video Analytics Infrastructure",
            "problem": "Retail chain needed real-time customer behavior analytics across 2,000 stores. Existing solution couldn't scale beyond 50 cameras without latency degradation.",
            "solution": "Designed distributed video processing architecture with edge-cloud hybrid approach. Custom tracking algorithms optimized for retail environments. Built centralized analytics dashboard with real-time aggregation.",
            "impact": "Scaled to 15,000 concurrent camera streams. 95ms average end-to-end latency. Enabled data-driven store layout optimization increasing sales 12%.",
            "stack": ["DeepStream", "CUDA", "Apache Flink", "TimescaleDB", "Grafana", "Kubernetes"]
        },
        {
            "title": "ML Platform & Feature Store",
            "problem": "Data science team spending 60% of time on infrastructure instead of modeling. No reproducibility, inconsistent feature definitions, 3-week average model deployment cycle.",
            "solution": "Built internal ML platform with automated training pipelines, centralized feature store, model registry, and one-click deployment. Implemented A/B testing framework and model monitoring.",
            "impact": "Model deployment reduced from 3 weeks to 2 days. Feature reuse increased 400%. Platform now supports 50+ models in production across 8 product teams.",
            "stack": ["MLflow", "Feast", "Airflow", "Kubernetes", "Seldon", "Great Expectations"]
        }
    ],
    "articles": [
        {
            "title": "The Hidden Costs of ML Technical Debt",
            "description": "Why your model retraining pipeline is a ticking time bomb",
            "category": "Engineering"
        },
        {
            "title": "Beyond Accuracy: Metrics That Actually Matter in Production ML",
            "description": "Latency, throughput, and the metrics your stakeholders care about",
            "category": "Strategy"
        },
        {
            "title": "Building ML Teams That Ship",
            "description": "Organizational patterns for high-velocity machine learning",
            "category": "Leadership"
        },
        {
            "title": "TensorRT Optimization: A Practical Guide",
            "description": "From PyTorch to production with 10x speedup",
            "category": "Technical"
        },
        {
            "title": "The Case Against Real-Time ML (Sometimes)",
            "description": "When batch processing is the right answer",
            "category": "Architecture"
        },
        {
            "title": "Computer Vision at Scale: Lessons from 1B Predictions",
            "description": "Infrastructure patterns for high-throughput vision systems",
            "category": "Technical"
        }
    ]
}


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "data": PORTFOLIO_DATA}
    )


@app.get("/health")
async def health():
    return {"status": "healthy"}
