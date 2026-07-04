# Content Model & Site Structure Plan — Phase 3

Reconciled from: updated CV (`Rakibul_Hasan_Naym_CV_Updated.docx`), Project Portfolio (`Rakibul_Hasan_Naym_Project_Portfolio.docx`), and still-accurate copy from the current site. **The CV + Project Portfolio docs are ground truth; nothing here is invented.**

---

## 0. Reconciliation decisions (please sanity-check these)

- **Title / positioning.** The updated CV headlines you as **"Applied AI Engineer — Production Computer Vision · Generative AI (RAG & AI Agents) · GPU-Optimized MLOps."** The Project Portfolio doc uses **"Head of Artificial Intelligence"** and **"Applied AI Engineer & AI Team Lead."** The old site said "Head of AI." → I'm leading the hero with **"Applied AI Engineer & AI Team Lead"** and noting the **Head of AI / AI leadership at HawkEyes** in About + Experience. This is stored as a single editable value (`profile.title`) so you can flip it to "Head of AI" in one line if you prefer.
- **Experience length.** CV says **"3+ years"** (not the old site's "6+"). Using **3+**.
- **Scale metric.** CV/portfolio say **2M+ outlets** and **~99% accuracy** (old site said 1.5M). Using **2M+ / ~99%**.
- **Email.** Standardizing on **rakib.hedigital@gmail.com** (your CV + account email). Dropping the old `naym.mj@gmail.com` and office alias from the public site unless you want them back.
- **Dropped placeholders.** Kaggle (`kaggle.com/rakibulhasan`) and Google Scholar links look like placeholders that 404 — **removed** until you give real URLs. LinkedIn, GitHub (`RH-NAYM`), Hugging Face personal (`rakib72642`) + org (`HawkEyesAI`) kept.
- **Metrics discipline.** Repo-evidenced numbers (commit counts, model counts, domains) stated as facts; CV-sourced numbers (2M+ outlets, ~99%) presented as such — mirroring how your own doc labels them.

---

## 1. Site map / navigation

```
/                 Home (single page: Hero · About · Skills · Featured Work · Experience · Contact)
/work/[slug]      Featured case studies (6) — Problem → Approach → Architecture → Results → Links
/projects         Full repository index (55 repos, grouped by 8 domains, filterable/searchable)
/blog             Blog index (MDX-driven)
/blog/[slug]      Blog post (MDX) — scaffolded with an authoring guide, no fake posts
```

Nav: **Work · Projects · Blog · About(scrolls) · Contact** + persistent GitHub / Hugging Face / LinkedIn / **Résumé (CV download)**.

## 2. Home page sections

1. **Hero** — name, title, one-line positioning, headline metric chips (2M+ outlets · ~99% accuracy · 55 repos / 8 domains · 50+ HF models · 5.0 Upwork), primary CTAs (View Work · Contact), quick socials. Light ambient background (no heavy always-on WebGL).
2. **About / positioning** — 2–3 tight paragraphs from CV summary (own end-to-end delivery; CV + GenAI; self-hosted GPU infra; current Bangla-TTS focus). Compact stat block.
3. **Skills** — **grouped competency clusters** (not percentage bars), keyword-rich for ATS:
   - Computer Vision & Retail Intelligence · Generative AI (RAG, Agents, LLMs) · Speech & OCR (Bangla focus) · GPU / Async Inference & Serving · MLOps & Self-Hosted Infra · Languages & Core ML.
4. **Featured Work** — 6 curated case-study cards linking to `/work/[slug]`.
5. **Experience timeline** — HawkEyes (Mar 2023–present, AI delivery/lead), Quantanite (Jan–Mar 2023, Data Analyst), Upwork freelance (2022, 5.0 rating), Education (BUBT BSc EEE, 2021, CGPA 3.75).
6. **Contact** — working contact form (Resend) + direct email/WhatsApp/LinkedIn + CV download.

Plus the **AI chat widget** (re-platformed to Vertex AI), available site-wide.

## 3. Featured case studies (the 6 that earn full pages)

Chosen for richest problem→impact narrative + verifiable artifacts:

1. **Retail-Execution Intelligence Platform** (BAT · Unilever · Nagad · Malaysia · Square) — flagship. Central inference service routing outlet images to campaign-specific YOLO models; POSM/planogram/share-of-shelf/competitor; ~99% across 2M+ outlets; BAT_Master = 397 commits/18 mo. *Repos: BAT-MASTER, UNILEVER-MASTER, Malay-DAIA, Squere_Demo, Nagad.*
2. **Real-Time Conversational Voice Agent** — WebRTC → VAD → STT → LangGraph → TTS; per-session memory, MCP tool-calling, multi-provider LLMs; latency engineering. 122 commits, most active repo. *Repo: Voice-AI-Agent.*
3. **Agentic & Grounded RAG** — Planner→Executor→Critic→Memory self-correcting agent over MongoDB Atlas Vector Search with SSE streaming; companion strict-grounding Bangla-PDF RAG (HE-Sherlock, FAISS). *Repos: AI-Agent_MongoDB, mongoRAG, HE-Sherlock.*
4. **Custom Bangladeshi-Accent Bangla TTS** (current focus) — VITS + grapheme frontend; for production inbound/outbound call agents (hospital appointment, sales, support). 90 commits, very active. *Repo: VITS-FineTune (+ genMaxTxt data pipeline).*
5. **On-Prem AI Server Infrastructure** — two self-hosted Ubuntu GPU servers built + administered in-house; in-house alternative to rented cloud GPU; complemented by vastai-automate GPU cost optimization. *Internal + vastai-automate.*
6. **Bangla OCR / ICR Engine** — custom PyTorch CRNN + CTC for low-resource Bangla script with synthetic data; REST-served. *Repos: Bangla-ICR (+ DemoOCRBangla, OCR_CloudVision_Gemeni).*

Each case-study page: hero (title, role, year, client/context), Problem, Approach, Architecture (pipeline description/diagram + stack), Results/Impact (with metric sourcing), Related repos/links, prev/next.

## 4. Full projects index (`/projects`)

All **55 repos** from the Project Portfolio doc, grouped by the 8 domains (Computer Vision & Retail Intelligence, Identity & Face Verification, OCR & Document Intelligence, LLM/RAG & Conversational AI, Speech/Audio & NLP, MLOps/Infra & Tooling, Web/Backend & Systems, OpenCV Fundamentals), each with one-line description + repo link + tech tags. Client-side domain filter + text search. This preserves the full depth without diluting the featured six.

## 5. Blog (`/blog`)

MDX content folder (`content/blog/*.mdx`) with frontmatter (title, date, summary, tags, readingTime). Ship **one authoring-guide placeholder post** explaining how to add a post — no fabricated articles. (The old site's 6 article *titles* can seed real posts later if you write them.)

## 6. Chatbot (Vertex AI)

Re-platform the "Rakibul AI" assistant from Groq/Ollama to **Google Vertex AI (Gemini)** via the existing `service_account.json` (project `calm-sylph-440605-q7`), called from a Next.js route handler. System prompt rebuilt from this reconciled content. Service-account key injected as a **base64 env var** in production (never committed).

---

*Next: Phase 4 build — Next.js (App Router, TS, Tailwind). Old FastAPI site backed up to `/legacy-fastapi-site/`, not deleted.*
