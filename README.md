# AI Portfolio - FastAPI + Jinja2

A modern, professional portfolio website for AI/ML executives built with FastAPI, Jinja2 templates, and pure CSS.

## Project Structure

\`\`\`
app/
├── main.py              # FastAPI application
├── templates/
│   ├── base.html        # Base layout template
│   └── index.html       # Main page template
├── static/
│   └── css/
│       └── main.css     # Stylesheet
├── requirements.txt     # Python dependencies
└── README.md
\`\`\`

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. **Run the server:**
   \`\`\`bash
   cd app
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   \`\`\`

3. **Open in browser:**
   \`\`\`
   http://localhost:8000
   \`\`\`

## Features

- ✅ FastAPI backend with Jinja2 templating
- ✅ Pure HTML5 + CSS3 (no JavaScript frameworks)
- ✅ Dark theme with professional design
- ✅ Fully responsive (desktop-first, mobile support)
- ✅ Semantic HTML structure
- ✅ CSS Grid & Flexbox layouts
- ✅ No inline styles
- ✅ Fast load times

## Customization

Edit the `PORTFOLIO_DATA` dictionary in `main.py` to update:
- Personal information
- About section
- Expertise areas
- Projects
- Articles
- Contact details

## Design Tokens

CSS variables in `main.css` control:
- Colors (accent, backgrounds, text)
- Typography (font families, sizes)
- Spacing scale
- Border radius
- Transitions
