# Peer Portfolio & Design Research — Phase 2

**Goal:** distill how strong applied-AI / ML / CV leaders present themselves online in 2026, and turn it into concrete rules for the rebuild. Sources are listed at the end.

---

## 1. What recruiters/hiring managers actually scan for

Reviewers spend **under ~90 seconds** on a first pass and look for three things, fast:

1. **Proof of shipped systems** — real APIs, deployed services, monitored-in-production work — not "can this person code."
2. **Quantified business impact** — e.g. "reduced false positives 22%, cutting review costs $11k/mo." Impact statements are what get a portfolio *forwarded* to a hiring manager.
3. **End-to-end ownership** — data → training → evaluation → deployment → monitoring/retraining.

Practical consequences for information architecture:
- The **skills section is scanned first** — and by ATS/AI ranking models too. Use clear headings, consistent labels, real keywords (PyTorch, YOLO, RAG, LangGraph, MLOps, FastAPI, CUDA, MongoDB Atlas Vector Search…).
- **Centralize external proof**: GitHub, Hugging Face, LinkedIn, live demos should be one click away everywhere.
- **Quality over volume**: 3–5 standout, well-documented case studies beat a wall of repos. (Rakib has 55 repos — so *curate the hero case studies*, and offer the full list as a scannable, secondary index rather than 55 equal cards.)

## 2. What makes case studies effective

- **One project = one skimmable page/section**, readable in **60–90 seconds**.
- Consistent spine: **Problem → Approach → Architecture/Tech → Result/Impact → Links**. This is exactly the shape Rakib's Project Portfolio doc already uses (Problem / Solution / Impact / Stack / History / Source), which ports cleanly.
- **Architecture communicated visually** (a simple diagram or a clear pipeline description) matters more than prose.
- **Verifiable**: every hero project should link to something real — a GitHub repo, a Hugging Face model/Space, or a live endpoint. "A project without a link is a project a reviewer can't verify."
- **Metrics must be honest and sourced.** Where a number comes from the CV rather than code, it's fine — just don't invent. (Rakib's own doc even labels CV-sourced vs code-evidenced metrics; we mirror that discipline.)

## 3. 2026 design direction — "futuristic but professional"

The dominant, durable 2026 themes (the ones that "held up after six months," not the fads):

- **Functional minimalism.** After years of parallax and autoplay-video backgrounds, the winning look is interfaces that **load fast and get out of the way**: fewer fonts, a tighter color system, generous whitespace.
- **Dark mode done well** — deep backgrounds + *one or two* vivid accents + **subtle** glow, not neon everywhere. Elegant and easy on the eyes, with proper contrast (WCAG AA).
- **Purposeful motion only.** Micro-interactions that confirm state (hover, button press, in-view reveals, section transitions). **Excessive animation = cognitive overload + slower perceived performance.** Respect `prefers-reduced-motion`.
- **Typography as the identity.** Confident, slightly oversized headlines in a strong sans; a mono face for the "engineer" texture. Kinetic/large type is on-trend, but restrained.
- **Retro-futurism/texture** is in — but as a light touch (grid lines, subtle grain, glow), not a theme costume.

## 4. Common mistakes to avoid

- **Over-animated hero** that tanks load time and readability (the current site's full-page Three.js neural background is exactly this risk on mobile / Bangladesh network conditions).
- **Neon-cyberpunk cliché** (Orbitron display font + heavy cyan glow) — reads "template," not "senior." Dial it way back.
- **Self-rated percentage skill bars** (Python 98%, CV 97%) — arbitrary and read as junior. Replace with **grouped, evidence-backed competencies** tied to real projects/repos.
- **Buzzword soup** with no metric or artifact behind it.
- **No clear CTA / contact path**, no CV download, weak SEO/OG. Recruiters need an obvious "hire me / contact / résumé" route.
- **Unoptimized media** (the current 1 MB profile PNGs) hurting LCP.

---

## 5. Concrete principles to apply in the rebuild (the actionable distillation)

**Information architecture**
1. Single-page home that answers "who / proof / impact / how to reach" in the first two screens: Hero (positioning + headline metrics + primary CTAs) → About → Skills (grouped, keyword-rich) → **Featured case studies (curated)** → Experience timeline → Contact.
2. **Dedicated case-study routes** for the 4–6 strongest projects (spine: Problem → Approach → Architecture → Result → Links).
3. A secondary **"All projects" index** that makes the 55-repo depth scannable (grouped by the 8 domains) without flattening everything into equal hero cards.
4. Persistent, one-click access to GitHub / Hugging Face / LinkedIn / CV download in nav + footer.

**Content**
5. Lead with **quantified, sourced impact** (2M+ outlets, ~99% accuracy, 397-commit flagship, 122-commit voice agent, 50+ HF models, 5.0 Upwork). Never invent numbers; label CV-sourced vs repo-evidenced where useful.
6. Replace skill bars with **competency clusters** (Production CV & Retail Intelligence · GenAI/RAG/Agents · Speech & OCR · GPU/Async Inference · MLOps & Self-hosted Infra) each backed by named projects.
7. Every featured project links to its real repo / HF model.

**Visual/technical**
8. Keep a **recognizable dark futuristic identity**, but: one confident sans + one mono, **one** primary accent (+ maybe one secondary), subtle glow/grid — no Orbitron, no wall of neon.
9. **Restrained, purposeful motion**; honor `prefers-reduced-motion`; replace the always-on full-page WebGL with a lighter, optional ambient effect that never blocks LCP.
10. **Performance & a11y first**: optimized images (WebP/AVIF, <150 KB), semantic HTML, AA contrast, keyboard nav, real meta/OpenGraph + JSON-LD, fast Core Web Vitals.

---

### Sources
- [Machine Learning Engineer Portfolio Playbook — interviewkickstart](https://interviewkickstart.com/blogs/articles/machine-learning-engineer-portfolio)
- [ML Engineer Portfolio Website — Free Template & Examples (2026) — magic-self.dev](https://www.magic-self.dev/examples/machine-learning-engineer)
- [How to Build an Engineering Portfolio That Gets You Hired — fonzi.ai](https://fonzi.ai/blog/portfolio-for-engineer)
- [ML Engineer Portfolio Projects That Will Get You Hired — Interview Node](https://www.interviewnode.com/post/ml-engineer-portfolio-projects-that-will-get-you-hired-in-2025)
- [Top Web Design Trends for 2026 — Figma](https://www.figma.com/resource-library/web-design-trends/)
- [Web Design Trends 2026: What Actually Held Up After Six Months — DEV](https://dev.to/studiomeyer_io/web-design-trends-2026-what-actually-held-up-after-six-months-23p8)
- [Top 10 Minimalist Web Design Trends For 2026 — Digital Silk](https://www.digitalsilk.com/digital-trends/minimalist-web-design-trends/)
- [Portfolio design trends for 2026 — Envato Elements](https://elements.envato.com/learn/portfolio-trends)
