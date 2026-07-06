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
  email: "naym.mj@gmail.com",
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
    handle: "naym.mj@gmail.com",
    url: "mailto:naym.mj@gmail.com",
  },
  upwork: {
    label: "Upwork",
    handle: "@mdrakibulhasannaym",
    // Public share link — works for signed-out visitors, unlike the vanity
    // /freelancers/mdrakibulhasannaym URL which can bounce logged-out users.
    url: "https://www.upwork.com/freelancers/~015c849967a428cc5d?mp_source=share",
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

// Roles are grouped by employer — mirrors LinkedIn's internal-promotion
// display (one company, several titles over time) so the timeline stays
// accurate to the real progression instead of collapsing it into one title.
export type ExperienceRole = { title: string; period: string; bullets: string[] };
export type ExperienceLink = { label: string; url: string };
export type ExperienceItem = {
  org: string;
  location: string;
  totalPeriod: string;
  roles: ExperienceRole[];
  link?: ExperienceLink;
};

export const experience: ExperienceItem[] = [
  {
    org: "HawkEyes Digital Monitoring Ltd.",
    location: "Dhaka, Bangladesh",
    totalPeriod: "Mar 2023 – Present · 3 yrs 5 mos",
    roles: [
      {
        title: "Applied AI Engineer & AI Team Lead",
        period: "Aug 2024 – Present",
        bullets: [
          "Lead AI strategy, architecture, and end-to-end delivery — research through deployment and monitoring — across retail-execution, manufacturing, and surveillance product lines; mentor a growing AI team.",
          "Architected production RAG and multi-agent systems (MongoDB Atlas Vector Search, LangGraph, self-correcting Planner→Executor→Critic loops, SSE streaming) plus strict-grounding RAG over Bangla PDFs.",
          "Engineered a real-time conversational voice agent (WebRTC/WebSocket, VAD→STT→LangGraph→TTS, per-session memory, MCP tool-calling) with explicit latency engineering.",
          "Designed, built, and administer two on-premises Ubuntu GPU servers hosting most of the team's AI services and training — an in-house alternative to rented cloud GPUs.",
        ],
      },
      {
        title: "Artificial Intelligence Engineer",
        period: "Feb 2024 – Aug 2024",
        bullets: [
          "Designed, developed, and deployed AI solutions across computer vision, OCR, and NLP, contributing to enterprise-scale retail analytics and intelligent automation projects.",
          "Extended multi-client production detection to Unilever (10+ versioned models with cross-model reconciliation), Malaysia, Square, and Nagad — POSM, planogram, share-of-shelf, and competitor detection.",
          "Began building the team's first Retrieval-Augmented Generation (RAG) systems and a custom Bangla OCR/ICR pipeline for document intelligence.",
        ],
      },
      {
        title: "Junior Artificial Intelligence Engineer",
        period: "Mar 2023 – Feb 2024",
        bullets: [
          "Supported the development and deployment of AI and computer-vision solutions for retail analytics and intelligent automation, building production experience in machine learning and backend integration.",
          "Built and scaled the flagship retail-execution CV platform serving 2M+ outlets at ~99% accuracy, routing each outlet image to campaign-specific YOLO models behind async FastAPI services (BAT program: 397 commits over 18 months).",
          "Delivered the team's first production multi-client detection deployment for BAT, establishing the FastAPI/YOLO architecture later extended across every client program.",
        ],
      },
    ],
  },
  {
    org: "Quantanite",
    location: "Dhaka, Bangladesh",
    totalPeriod: "Jan 2023 – Mar 2023 · 3 mos",
    roles: [
      {
        title: "Data Analyst",
        period: "Jan 2023 – Mar 2023",
        bullets: [
          "Executed large-scale data analysis, quality assurance, and operational reporting supporting business-intelligence initiatives across client accounts.",
        ],
      },
    ],
  },
  {
    org: "Upwork",
    location: "Remote",
    totalPeriod: "Jan 2022 – Dec 2022 · 1 yr",
    link: {
      label: "Real-Time Custom Object Detection (Upwork)",
      url: "https://www.upwork.com/services/product/development-it-a-real-time-custom-object-detection-machine-learning-model-1550132751383220224?ref=project_share",
    },
    roles: [
      {
        title: "Freelance ML / Computer Vision Engineer",
        period: "Jan 2022 – Dec 2022",
        bullets: [
          "Delivered YOLOv5-based computer-vision solutions and project supervision for international clients; maintained a 5.0/5.0 client rating across completed contracts (image processing, deep learning, Python, C++).",
        ],
      },
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

// Compact "focus pillar" chips shown under the About copy — one per core
// competency, mirrored from the About paragraphs above so the two never drift.
export type AboutPillar = { key: "cv" | "genai" | "infra"; label: string; note: string };
export const aboutPillars: AboutPillar[] = [
  { key: "cv", label: "Computer Vision", note: "YOLO detection & segmentation at 2M+ outlets, ~99% accuracy." },
  { key: "genai", label: "Generative AI", note: "Production RAG, LangGraph multi-agent systems, voice agents." },
  { key: "infra", label: "MLOps & Infra", note: "Self-hosted GPU servers, Docker, GPU-optimized inference." },
];

export const siteUrl = "https://rakib-portfolio-lilac.vercel.app";
