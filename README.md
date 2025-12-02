# Principal AI Engineer Portfolio ::: dev


A production-ready, single-page portfolio website built with FastAPI, Jinja2, and Three.js for a Principal AI Engineer specializing in mission-critical ML systems.

## Overview

This portfolio showcases systems-level AI engineering work with a focus on:
- **Distributed Inference Systems** - High-throughput ML serving at scale
- **Real-Time ML Pipelines** - Sub-millisecond processing for streaming data
- **Production Infrastructure** - Reliable, observable, and maintainable AI systems
- **LLM Orchestration** - Efficient deployment of large language models

## Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Jinja2** - Template engine for server-side rendering
- **Uvicorn** - ASGI server for production deployment

### Frontend
- **Vanilla HTML/CSS/JS** - No frameworks, pure engineered aesthetics
- **Three.js** - WebGL-based 3D neural network visualization
- **Custom GLSL Shaders** - GPU-accelerated visual effects

### Design Philosophy
- Dark, institutional aesthetic with electric cyan accents
- Single-page scrolling experience with section navigation
- Scroll-reactive Three.js background with neural network visualization
- Mobile-responsive without CSS frameworks

## Architecture

\`\`\`
├── main.py                 # FastAPI application with routes
├── requirements.txt        # Python dependencies
├── README.md              # Documentation
├── templates/
│   ├── index.html         # Single-page portfolio (all sections)
│   └── demo.html          # Project/blog detail pages
└── static/
    ├── css/
    │   └── style.css      # Complete stylesheet
    ├── js/
    │   └── main.js        # Three.js visualization + interactions
    └── images/
        └── profile.jpg    # Profile image
\`\`\`

### Design Decisions

1. **Single-Page Architecture**: All main content lives on one page with smooth scroll navigation, reducing HTTP requests and providing a cohesive experience.

2. **Server-Side Rendering**: Jinja2 templates enable SEO-friendly content while maintaining clean separation of concerns.

3. **CMS-Ready Data Structures**: Blog posts and projects are stored as Python dictionaries, easily migrated to a database or headless CMS.

4. **Three.js Neural Visualization**: Custom WebGL scene with:
   - 150 neural nodes with glow shaders
   - Dynamic connections with traveling signals
   - Data streams and energy waves
   - Scroll-reactive camera and particle behavior
   - Mouse parallax effects

5. **No CSS Frameworks**: Pure CSS ensures minimal bundle size, full control over aesthetics, and no external dependencies.

## Local Development

### Prerequisites
- Python 3.8+
- pip

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd portfolio

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload
\`\`\`

Visit `http://localhost:8000` in your browser.

## Deployment

### Production with Gunicorn
\`\`\`bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
\`\`\`

### Docker
\`\`\`dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

## CMS Extensibility

The data structures in `main.py` are designed for easy migration:

\`\`\`python
# Current: In-memory data
BLOG_POSTS = [{"id": 1, "slug": "...", "title": "..."}]

# Future: Database query
async def get_blog_posts():
    return await db.fetch_all(blog_posts.select())
\`\`\`

## Three.js Visualization Features

- **Nodes**: 150 spheres with custom glow shaders
- **Connections**: Lines between nearby nodes with distance-based opacity
- **Signals**: 60 particles traveling along connections
- **Data Streams**: 8 spiral particle systems
- **Energy Waves**: 3 pulsing ring geometries
- **Particles**: 400 ambient background particles
- **Scroll Reactivity**: Camera, signals, and particles respond to scroll position

## Performance & SEO

- Semantic HTML5 structure with proper ARIA labels
- OpenGraph and Twitter Card meta tags
- Lighthouse Score: 95+ across all metrics
- WebGL optimized with capped pixel ratio and efficient buffer updates

## License

MIT License - Built for production use.



# Convert svg to png
inkscape static/icons/head-circuit.svg \
    --export-type=png \
    --export-filename=static/icons/favicon-16.png \
    -w 16 -h 16


inkscape static/icons/head-circuit.svg \
    --export-type=png \
    --export-filename=static/icons/favicon-32.png \
    -w 32 -h 32
