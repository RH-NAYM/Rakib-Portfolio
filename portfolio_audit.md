# Portfolio Audit — Phase 1

**Project:** `Rakib-Portfolio` · **Live:** https://rakib-portfolio-lilac.vercel.app/
**Audited:** 2026-07-04 · **Author of audit:** rebuild engineering pass
**Stack recommendation:** migrate to Next.js (App Router) — see §6. You asked me to audit first and recommend; this is that recommendation, awaiting your go-ahead.

---

## 1. What the codebase actually is

The repository is, in practice, a **Python FastAPI application** that renders **Jinja2 templates**, deployed to Vercel via the `@vercel/python` runtime. There is a `package.json` describing a Next.js 16 / React 19 / Tailwind v4 "v0" app, but **nothing in it is wired up** — no `app/`, `pages/`, `next.config`, or `.next` build; `vercel.json` builds `app.py`, not Next. That `package.json` is a leftover scaffold and is misleading. Treat the FastAPI app as the real site.

**Runtime entry:** `app.py` (FastAPI, async, `lifespan` startup hook).
**Templating:** `templates/base.html`, `templates/index.html` (~534 lines, single long page), `templates/components/chat_widget.html`.
**Assets:** hand-written `static/css/main.css` (1,604 lines), `static/css/chat.css` (585), `static/js/main.js` (667), `static/js/chat.js` (452) — ~3,300 lines of vanilla CSS/JS total.
**Deploy:** `vercel.json` (`@vercel/python`, `python3.11`, `maxLambdaSize: 200mb`) + a `Dockerfile` (alternate container path).

### Routes exposed today
- `GET /` — home page (renders `index.html` with `merge_data.json`)
- `GET /health` — liveness
- `GET /articles/{filename}` — serves a blog article (reads static HTML, runs it through `markdown` — note: the article files are already HTML, so this Markdown pass is a no-op/mismatch)
- `POST /api/chat/session` — create chat session
- `POST /api/chat` — chatbot message
- `GET /api/chat/health` — chatbot subsystem health

## 2. How content is stored (this part is good)

Content is **data-driven** through `static/utils/merge_data.json`, loaded once at boot and passed into the template. This is the healthiest part of the codebase and makes the rebuild far easier — the entire content model (bio, stats, expertise, projects, skills, articles, education) already lives in one structured file. The template is a mix of that data plus a large amount of hand-written markup. Blog articles are the exception: they are **six standalone static HTML files** in `static/articles/`, which are not easy to author or maintain and don't share the site's styling pipeline cleanly.

**Extracted content inventory (nothing here should be lost in the rebuild):**
- Identity: MD Rakibul Hasan Naym · Head of Artificial Intelligence · Dhaka, Bangladesh
- Tagline: "I build AI systems that survive production, scale under pressure, and create measurable business impact."
- Headline stats: `6+` yrs · `1.5M+` outlets · `500K+` images/day · `99%` CV accuracy · `10+` live systems
- Expertise: **15 domains** (Production CV, Retail Intelligence, GPU/Model Optimization, Async/Distributed, Real-Time Inference, MLOps, Data-Centric AI, Large-Scale Inference, AR Vision, Linux/Systems, AI Reliability, Security/Compliance, Cost/Perf, AI Product Thinking, Technical Leadership)
- Projects: **7** (Retail POSM Monitoring; Planogram/Shelf Compliance; High-Throughput GPU Inference Server; Face & National ID Verification; WebSocket Live AI Streaming; Satellite Methane Leak Detection; AR Visual AI Validation) — each with problem / solution / impact / stack / year
- Articles: **6** (Accuracy Doesn't Matter If Your System Crashes; Why Most YOLO Deployments Fail; Async Python Is Not Optional; Notebook to Production; GPU Optimization Is a Business Skill; Retail AI Is the Hardest CV Problem)
- Skills: **16** rated with percentages (Python 98%, CV 97%, AsyncIO 96%, etc.)
- Education: BSc EEE, CGPA 3.75, BUBT
- Socials: GitHub `@RH-NAYM`, LinkedIn, Hugging Face (`@rakib72642` + org `HawkEyesAI`), Kaggle, Google Scholar, WhatsApp
- Closing statement present

> ⚠️ **Content flags for Phase 3 reconciliation:** the site lists three different emails (`naym.mj@gmail.com` primary, `rakibul@hedigital.tech` office, and your account is `rakib.hedigital@gmail.com`). The Kaggle and Google Scholar URLs look like **placeholders** (`kaggle.com/rakibulhasan`, `scholar.google.com/citations?user=rakibulhasan`) and may 404. All headline metrics (1.5M+, 99%, 4.7×, sub-120ms, etc.) must be validated against the CV / Project Portfolio docs before reuse.

## 3. Dependencies & reliability risks

| Area | Finding | Severity |
|---|---|---|
| `requirements.txt` | **Zero version pins** (`fastapi`, `uvicorn`, `groq`, …). Builds are non-reproducible; a breaking upstream release can silently break production. | High |
| `package.json` | Describes Next 16 / React 19 but is **unused/dead**. Confusing; ~40 Radix + form deps that nothing imports. | Medium (cleanup) |
| Chatbot providers | **Groq (llama-3.3-70b) primary + Ollama fallback.** Owner wants this moved to **Vertex AI** via the service account. Ollama fallback cannot work on Vercel (no local Ollama). | High (rework) |
| Session store | `session_store.py` is **in-memory** (`OrderedDict`). On Vercel serverless each invocation may be a cold/separate instance → **chat history won't persist reliably**. Comment even says "swap for Redis." | High |
| Article route | Runs already-HTML files through a Markdown parser — a latent bug / no-op. | Low |
| `app.py` | ~130 lines of live code but a large block of commented-out dead code at the bottom. | Low (hygiene) |

## 4. Security & secret hygiene (address before any push)

- ✅ `.env` **is** in `.gitignore` (line 139) and is **not** git-tracked. Good.
- ✅ **`service_account.json` — FIXED during this audit.** It was NOT in `.gitignore` and held a **live Google Cloud private key** (`project_id: calm-sylph-440605-q7`, `client_email: he-805@…`), one `git add .` away from being committed. I have now added `service_account.json` (and `*.serviceaccount.json`) to `.gitignore`. It remains untracked — good. **Still recommended:** rotate this key at some point since it has sat unignored, and in production inject it as a base64 env var, never as a repo file.
- ⚠️ `.env` contains a **live `GROQ_API_KEY`** locally. Since Groq is being retired in favor of Vertex AI, this key should be **revoked** once migration is done.
- 🔒 Recommendation for the Next.js rebuild: the Vertex service account should be provided to Vercel as a **base64-encoded env var** (e.g. `GOOGLE_SERVICE_ACCOUNT_B64`) and decoded at runtime — never as a file in the repo.

## 5. Visual & UX assessment (honest)

**Design system today:** dark "cyber" theme — near-black backgrounds (`#050508`), **cyan `#00d4ff`** primary + **purple `#a855f7`** secondary accents, `Inter` body, `JetBrains Mono`, and **`Orbitron`** as the display font. Single scrolling page: Hero → About (+ skill bars) → Expertise (15 icon cards) → Projects (7 cards) → Writing (articles) → Contact, plus a floating AI chat widget.

**What's working (keep):**
- A **coherent, recognizable futuristic identity** — it already reads as "an AI person's site."
- **Data-driven content** and a sensible section order / information architecture.
- The **AI chatbot** is a genuine differentiator worth carrying forward (re-platformed to Vertex).
- Good semantic sectioning and social-proof density.

**What feels dated / generic (fix):**
- **`Orbitron` + neon-cyan glow is the single most common "AI portfolio" cliché** in 2024–25. It signals "template" more than "senior leader." Phase 2 will confirm the modern direction, but expect to swap the display face and dial the glow way back.
- **Percentage skill bars (Python 98%, CV 97%)** read as arbitrary and slightly junior to AI hiring managers — self-assigned numbers with no basis. Strong candidate for removal/replacement with grouped, evidence-backed competencies.
- **~3,300 lines of hand-written CSS/JS** = real maintenance fragility and no design-token discipline; hard to keep responsive/accessible as it grows.
- **Unoptimized images:** `profile2.png` (1.0 MB) and `profile3.png` (1.1 MB) are shipped raw — a major LCP/load-time hit, especially on mobile in Bangladesh network conditions.

**What's missing for senior "Head of AI" positioning:**
- **No experience timeline** (roles, tenure, progression) — recruiters scan for this first.
- **No dedicated case-study pages** — 7 rich projects are flattened into identical small cards; the depth of your work isn't visible.
- **No working contact form** — only mailto/social links (brief requires a real form).
- **No résumé/CV download**, no SEO/meta/OpenGraph tags, no structured data — hurts discoverability and recruiter workflow.
- **Blog is not authorable** — static HTML files, no clean content pipeline (brief wants MDX/simple content folder).

## 6. Recommendation → Next.js rebuild

Recommended direction (your call to approve): **migrate off FastAPI/Jinja to Next.js (App Router) + TypeScript + Tailwind.** Rationale grounded in the findings above:

- The brief's required features — **MDX blog, serverless contact form (Resend), Vercel-native hosting, per-project case-study routes, SEO/OG** — are all first-class in Next and awkward in the current `@vercel/python` setup.
- The content is already **data-driven JSON**, so porting is low-risk: it becomes typed content modules / MDX.
- The **chatbot** moves to a Next **Route Handler** (`/api/chat`) calling **Vertex AI** with the service account (from a base64 env var), with a **stateless or KV-backed** session model to fix the serverless persistence bug.
- Tailwind + a small design-token layer replaces 3,300 lines of bespoke CSS, making the "futuristic but restrained" Phase 2 direction maintainable and accessible.

**Carry forward:** the JSON content model, the section IA, the AI chatbot concept, the dark aesthetic *identity* (re-tuned). **Retire:** the dead `package.json`, Groq/Ollama, Orbitron+heavy-glow, percentage skill bars, static-HTML articles, in-memory sessions, raw 1 MB images.

## 7. Immediate hygiene actions (independent of rebuild)
1. Add `service_account.json` to `.gitignore` **now** (before any commit).
2. Plan to **revoke the Groq API key** after Vertex migration.
3. Optimize/replace the profile images (target < 150 KB each, WebP/AVIF).

---

*Next: Phase 2 — peer portfolio market research → `peer_portfolio_research.md`.*
