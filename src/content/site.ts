// ─────────────────────────────────────────────────────────────────────────────
// Ground-truth site content. Every value here traces to the updated CV
// (Rakibul_Hasan_Naym_CV_Updated.docx) or the Project Portfolio doc.
// Edit copy here — the UI reads from these typed objects.
// ─────────────────────────────────────────────────────────────────────────────

import { repos, domains } from "@/content/projects";

export const profile = {
  name: "MD Rakibul Hasan Naym",
  shortName: "Rakib",
  // Flip to "Head of AI" here if you prefer that framing everywhere.
  title: "Applied AI Engineer & AI Team Lead",
  tagline:
    "Production Computer Vision · Generative AI (RAG & AI Agents) · GPU-Optimized MLOps",
  positioning:
    "I design, build, and own production AI at national scale — computer-vision systems serving 2M+ retail outlets, plus current-generation RAG, multi-agent, and real-time voice systems, all on GPU-optimized, self-hosted infrastructure.",
  location: "Dhaka, Bangladesh",
  email: "rakib.hedigital@gmail.com",
  phone: "+880 163 883 0165",
  company: "HawkEyes Digital Monitoring Ltd.",
  availability: "Open to BD & international / remote AI roles",
} as const;

export const socials = {
  github: { label: "GitHub", handle: "@RH-NAYM", url: "https://github.com/RH-NAYM" },
  huggingface: {
    label: "Hugging Face",
    handle: "@rakib72642",
    url: "https://huggingface.co/rakib72642",
  },
  huggingfaceOrg: {
    label: "HF · HawkEyesAI",
    handle: "HawkEyesAI",
    url: "https://huggingface.co/HawkEyesAI",
  },
  linkedin: {
    label: "LinkedIn",
    handle: "in/rakib",
    url: "https://www.linkedin.com/in/md-rakibul-hasan-naym-625263229",
  },
  whatsapp: {
    label: "WhatsApp",
    handle: "+880 1638 830165",
    url: "https://wa.me/8801638830165",
  },
  email: {
    label: "Email",
    handle: "rakib.hedigital@gmail.com",
    url: "mailto:rakib.hedigital@gmail.com",
  },
} as const;

// Headline metrics — CV/portfolio sourced. Keep honest.
// Repo/domain counts are derived from content/projects.ts (the single source
// of truth) so this stat can never drift out of sync with /projects.
export const metrics = [
  { value: "2M+", label: "Retail outlets served" },
  { value: "~99%", label: "Detection accuracy" },
  { value: String(repos.length), label: `Repos · ${domains.length} AI domains` },
  { value: "50+", label: "Hugging Face models" },
  { value: "5.0", label: "Upwork rating" },
] as const;

export const about = [
  "I'm an Applied AI Engineer with 3+ years designing, building, and deploying production AI at national scale. At HawkEyes Digital Monitoring I own applied-AI delivery end to end — from research and model design through deployment and monitoring — across retail-execution, manufacturing, and surveillance product lines, and I mentor a growing AI team.",
  "My core is deep computer vision (YOLO detection/segmentation, OpenCV) shipping at ~99% accuracy across 2M+ outlets for enterprise FMCG and mobile-financial-services clients — BAT, Unilever, and Nagad among them. I pair that with current generative-AI delivery: production RAG with vector search and LangGraph, self-correcting multi-agent systems, and real-time voice agents — all backed by GPU-optimized async inference and containerized MLOps.",
  "I build and run my own infrastructure: two on-premises Ubuntu GPU servers I provisioned and administer host most of the team's AI services and training jobs, cutting reliance on rented cloud GPUs. I'm currently building a custom Bangladeshi-accent Bangla text-to-speech model (VITS + grapheme frontend) to power production AI voice agents for inbound/outbound call automation. I care equally about model accuracy and clean, observable production engineering.",
] as const;

export type SkillGroup = { title: string; note: string; items: string[] };

export const skillGroups: SkillGroup[] = [
  {
    title: "Computer Vision & Retail Intelligence",
    note: "Detection, segmentation & analytics shipped at retail scale",
    items: [
      "Ultralytics YOLO (v5/v8) — detection & segmentation",
      "OpenCV & classical CV",
      "POSM / planogram / share-of-shelf",
      "Object detection & counting",
      "Face recognition (dlib / face_recognition)",
      "MediaPipe, LightGlue",
    ],
  },
  {
    title: "Generative AI — RAG, Agents & LLMs",
    note: "Grounded, self-correcting LLM systems in production",
    items: [
      "Retrieval-Augmented Generation (RAG)",
      "LangChain · LangGraph (Planner→Executor→Critic)",
      "Vector search — MongoDB Atlas, FAISS",
      "Embeddings — sentence-transformers / E5",
      "Tool-calling (MCP), prompt engineering",
      "Ollama · OpenAI · Google Gemini · HF Transformers",
    ],
  },
  {
    title: "Speech, Audio & OCR",
    note: "Low-resource Bangla speech & document intelligence",
    items: [
      "TTS — Coqui VITS, edge-tts (Bangla TTS)",
      "STT — faster-whisper, AssemblyAI",
      "Bangla OCR / ICR (custom CRNN + CTC)",
      "Google Cloud Vision & Speech, Tesseract",
      "Grapheme text frontend, NLTK",
      "WebRTC / WebSocket audio streaming",
    ],
  },
  {
    title: "Backend, Serving & GPU Inference",
    note: "Async-first services engineered for throughput",
    items: [
      "FastAPI · asyncio · Hypercorn / Uvicorn",
      "WebRTC / WebSockets, REST APIs",
      "httpx / aiohttp, structured logging",
      "GPU optimization & async batching",
      "PyTorch, TensorFlow, torchaudio",
      "Redis · MongoDB · PostgreSQL",
    ],
  },
  {
    title: "MLOps & Self-Hosted Infrastructure",
    note: "In-house GPU infra and reproducible deployment",
    items: [
      "On-prem Ubuntu GPU server build & admin",
      "Docker & Docker Compose",
      "Vast.ai GPU orchestration & cost optimization",
      "Git / Git LFS, Hugging Face deploy",
      "GCP (Vision / Speech / GenAI), Vercel",
      "Label Studio · Roboflow data pipelines",
    ],
  },
  {
    title: "Languages, Core ML & Systems",
    note: "Foundations and the Linux environment it all runs on",
    items: [
      "Python · C++ · SQL · Bash",
      "PyTorch, scikit-learn, NumPy, pandas",
      "CNNs, fine-tuning, model evaluation",
      "Linux power user — Arch (daily driver 3+ yrs)",
      "Ubuntu / Fedora / Pop!_OS server admin",
      "AI roadmap ownership & team mentoring",
    ],
  },
];

export type ExperienceItem = {
  role: string;
  org: string;
  location: string;
  period: string;
  bullets: string[];
};

export const experience: ExperienceItem[] = [
  {
    role: "Applied AI Engineer & AI Team Lead",
    org: "HawkEyes Digital Monitoring Ltd.",
    location: "Dhaka, Bangladesh",
    period: "Mar 2023 – Present",
    bullets: [
      "Own applied-AI delivery end to end — research, model design, deployment, and monitoring — across retail-execution, manufacturing, and surveillance product lines; mentor a growing AI team.",
      "Built and scaled the flagship retail-execution CV platform serving 2M+ outlets at ~99% accuracy, routing each outlet image to campaign-specific YOLO models behind async FastAPI services (BAT program: 397 commits over 18 months).",
      "Delivered multi-client production detection for BAT, Unilever (10+ versioned models with cross-model reconciliation), Malaysia, Square, and Nagad — POSM, planogram, share-of-shelf, and competitor detection.",
      "Architected production RAG and multi-agent systems (MongoDB Atlas Vector Search, LangGraph, self-correcting Planner→Executor→Critic loops, SSE streaming) plus strict-grounding RAG over Bangla PDFs.",
      "Engineered a real-time conversational voice agent (WebRTC/WebSocket, VAD→STT→LangGraph→TTS, per-session memory, MCP tool-calling) with explicit latency engineering.",
      "Designed, built, and administer two on-premises Ubuntu GPU servers hosting most of the team's AI services and training — an in-house alternative to rented cloud GPUs.",
    ],
  },
  {
    role: "Data Analyst",
    org: "Quantanite",
    location: "Dhaka, Bangladesh",
    period: "Jan 2023 – Mar 2023",
    bullets: [
      "Executed large-scale data analysis, quality assurance, and operational reporting supporting business-intelligence initiatives across client accounts.",
    ],
  },
  {
    role: "Freelance ML / Computer Vision Engineer",
    org: "Upwork (Remote)",
    location: "Remote",
    period: "2022",
    bullets: [
      "Delivered YOLOv5-based computer-vision solutions and project supervision for international clients; maintained a 5.0/5.0 client rating (image processing, deep learning, Python, C++).",
    ],
  },
];

export const education = {
  degree: "B.Sc. in Electrical & Electronic Engineering",
  institution: "Bangladesh University of Business and Technology (BUBT)",
  year: "2021",
  cgpa: "CGPA 3.75 / 4.00",
} as const;

export const recognition = [
  "Maintainer of 50+ personal and 11+ organizational Hugging Face model repositories spanning computer vision, OCR, LLM fine-tuning, and deployment workflows.",
  "Author of an open-source OpenCV computer-vision tutorial series and production-ready model cards / inference scripts adopted by the wider ML community.",
  "Upwork: 5.0/5.0 client rating on delivered ML and computer-vision contracts.",
] as const;

export const languages = "Bangla (native) · English (professional working proficiency)";

export const siteUrl = "https://rakib-portfolio-lilac.vercel.app";
