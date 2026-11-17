// ─────────────────────────────────────────────────────────────────────────────
// Ground-truth site content. Every value here traces to the updated CV
// (Rakibul_Hasan_Naym_CV_Updated.docx) or the Project Portfolio doc.
// Edit copy here — the UI reads from these typed objects.
// ─────────────────────────────────────────────────────────────────────────────

import { repos, domains } from "@/content/projects";

export const profile = {
  name: "MD Rakibul Hasan Naym",
  shortName: "Rakib",
  // Keep in sync with LinkedIn, Upwork and Fiverr — all use "Applied AI Engineer".
  title: "Applied AI Engineer & AI Team Lead",
  tagline:
    "Production Computer Vision · Generative AI (RAG & AI Agents) · GPU-Optimized MLOps",
  positioning:
    "I design, build, and own production AI at national scale — computer-vision systems serving 2M+ retail outlets, plus current-generation RAG, multi-agent, and real-time voice systems, all on GPU-optimized, self-hosted infrastructure.",
  location: "Dhaka, Bangladesh",
  email: "naym.mj@gmail.com",
  phone: "+880 163 883 0165",
  company: "HawkEyes Digital Monitoring Ltd.",
  availability: "Open to BD & international / remote AI roles and freelance projects",
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
  fiverr: {
    label: "Fiverr",
    handle: "@rakib72642",
    url: "https://www.fiverr.com/rakib72642",
  },
} as const;

// Freelance services — mirrors the live Fiverr gigs and Upwork Project Catalog
// (same scope and starting prices on both), so the site never quotes a
// different number than the marketplaces do.
export type Service = { title: string; blurb: string; from: string; image: string };
export const services: Service[] = [
  {
    title: "Custom YOLO object detection",
    blurb: "Detection & segmentation trained on your data — retail, safety, vehicles, defects — with metrics and an inference API.",
    from: "$90", image: "/images/services/g01-yolo.jpg",
  },
  {
    title: "RAG chatbot over your documents",
    blurb: "Answers only from your PDFs, sites or database, with citations and groundedness checks. OpenAI, Gemini, Claude or local.",
    from: "$150", image: "/images/services/g02-rag.jpg",
  },
  {
    title: "AI voice agent with real phone calls",
    blurb: "LiveKit + Twilio SIP agents for booking, sales and support — streaming STT, tool calling, low-latency TTS, human hand-off.",
    from: "$300", image: "/images/services/g03-voice.jpg",
  },
  {
    title: "AI agents & automation (LangGraph)",
    blurb: "Tool-using and multi-agent systems with memory, MCP, a self-check step and traces — hard rules enforced in code.",
    from: "$120", image: "/images/services/g04-agents.jpg",
  },
  {
    title: "OCR & document data extraction",
    blurb: "Invoices, IDs, forms and handwriting to clean JSON/Excel — including custom OCR for low-resource scripts like Bangla.",
    from: "$100", image: "/images/services/g06-ocr.jpg",
  },
  {
    title: "Model deployment & GPU MLOps",
    blurb: "Your model as a fast async FastAPI service on Docker — batching, ONNX/FP16 speedups, CI/CD and monitoring.",
    from: "$60", image: "/images/services/g05-deploy.jpg",
  },
];

// Headline metrics — CV/portfolio sourced. Keep honest.
// Repo/domain counts are derived from content/projects.ts (the single source
// of truth) so this stat can never drift out of sync with /projects.
export const metrics = [
  { value: "2M+", label: "Retail outlets served" },
  { value: "~99%", label: "Detection accuracy" },
  { value: String(repos.length), label: `Repos across ${domains.length} AI domains` },
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
export type ExperienceRole = { title: string; period: string; bullets: string[]; stack?: string[] };
export type ExperienceLink = { label: string; url: string };
export type ExperienceItem = {
  org: string;
  location: string;
  period: string;
  duration: string;
  roles: ExperienceRole[];
  link?: ExperienceLink;
};

// One plain sentence per bullet (what was done and what it achieved);
// the tools live in `stack` so the sentences stay readable.
export const experience: ExperienceItem[] = [
  {
    org: "HawkEyes Digital Monitoring Ltd.",
    location: "Dhaka, Bangladesh",
    period: "Mar 2023 – Present",
    duration: "3 yrs 9 mos",
    roles: [
      {
        title: "Applied AI Engineer & AI Team Lead",
        period: "Aug 2024 – Present",
        bullets: [
          "Lead AI strategy and delivery, from research to deployment and monitoring, across retail-execution, manufacturing and surveillance products, and mentor a growing AI team.",
          "Built production RAG and multi-agent systems with self-correcting planner, executor and critic loops, plus strictly grounded RAG over Bangla PDFs.",
          "Built a real-time conversational voice agent with tuned latency, then took it to real outbound phone calls with local voice cloning.",
          "Designed, built and run two on-premises GPU servers that host most of the team's AI services and training, in place of rented cloud GPUs.",
        ],
        stack: ["LangGraph", "MongoDB Atlas Vector Search", "WebRTC", "LiveKit", "Twilio SIP", "XTTS v2", "MCP", "Ubuntu GPU servers"],
      },
      {
        title: "Artificial Intelligence Engineer",
        period: "Feb 2024 – Aug 2024",
        bullets: [
          "Shipped computer vision, OCR and NLP solutions for enterprise retail analytics and automation.",
          "Extended production detection to Unilever (10+ versioned models), Malaysia, Square and Nagad, covering POSM, planogram, share-of-shelf and competitor detection.",
          "Started the team's first RAG systems and a custom Bangla OCR/ICR pipeline.",
        ],
        stack: ["YOLO", "OCR / ICR", "RAG", "FastAPI"],
      },
      {
        title: "Junior Artificial Intelligence Engineer",
        period: "Mar 2023 – Feb 2024",
        bullets: [
          "Built and scaled the flagship retail-execution platform: 2M+ outlets at ~99% accuracy, with each outlet image routed to campaign-specific YOLO models behind async APIs.",
          "Delivered the team's first multi-client production deployment for BAT (397 commits over 18 months); its architecture now runs every client program.",
        ],
        stack: ["YOLO", "FastAPI", "async Python"],
      },
    ],
  },
  {
    org: "Quantanite",
    location: "Dhaka, Bangladesh",
    period: "Jan 2023 – Mar 2023",
    duration: "3 mos",
    roles: [
      {
        title: "Data Analyst",
        period: "Jan 2023 – Mar 2023",
        bullets: [
          "Ran large-scale data analysis, quality assurance and operational reporting for business-intelligence work across client accounts.",
        ],
      },
    ],
  },
  {
    org: "Upwork",
    location: "Remote",
    period: "Jan 2022 – Dec 2022",
    duration: "1 yr",
    link: {
      label: "Real-time custom object detection service",
      url: "https://www.upwork.com/services/product/development-it-a-real-time-custom-object-detection-machine-learning-model-1550132751383220224?ref=project_share",
    },
    roles: [
      {
        title: "Freelance ML / Computer Vision Engineer",
        period: "Jan 2022 – Dec 2022",
        bullets: [
          "Delivered computer-vision projects and project supervision for international clients, with a 5.0/5.0 rating across completed contracts.",
        ],
        stack: ["YOLOv5", "Python", "C++", "Image processing"],
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

// Rotating About-section profile photos — shuffled client-side every few
// seconds (see ProfileShuffle). Add/remove files in public/profile-photos/
// and update this list to change the rotation set.
export const profileImages = [
  "/profile-photos/photo-1.jpg",
  "/profile-photos/photo-2.jpg",
  "/profile-photos/photo-3.jpg",
  "/profile-photos/photo-4.jpg",
  "/profile-photos/photo-5.jpg",
] as const;
