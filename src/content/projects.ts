// ─────────────────────────────────────────────────────────────────────────────
// Projects — 8 featured case studies + the full 55-repo index.
// Sourced from Rakibul_Hasan_Naym_Project_Portfolio.docx and the CV.
// Repo-evidenced facts (commit counts, model counts) are stated as facts;
// CV-sourced scale metrics (2M+ outlets, ~99%) are marked with `source: "cv"`.
// ─────────────────────────────────────────────────────────────────────────────

export type Metric = { value: string; label: string; source?: "cv" | "repo" };
export type Link = { label: string; url: string };

export type CaseStudy = {
  slug: string;
  title: string;
  subtitle: string;
  context: string; // client / role / year line
  domain: string;
  featured: true;
  tags: string[];
  metrics: Metric[];
  problem: string;
  approach: string[];
  architecture: { pipeline: string[]; stack: string[] };
  results: { text: string; source?: "cv" | "repo" }[];
  links: Link[];
  related: string[]; // repo names
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "retail-execution-intelligence",
    title: "Retail-Execution Intelligence Platform",
    subtitle:
      "Campaign-specific computer vision for POSM, planogram, share-of-shelf & competitor detection at national scale.",
    context: "HawkEyes · BAT · Unilever · Nagad · Malaysia · Square · 2023–present",
    domain: "Computer Vision & Retail Intelligence",
    featured: true,
    tags: ["FastAPI", "Ultralytics YOLO", "PyTorch", "async httpx", "Hypercorn", "Hugging Face"],
    metrics: [
      { value: "2M+", label: "outlets served", source: "cv" },
      { value: "~99%", label: "detection accuracy", source: "cv" },
      { value: "397", label: "commits · flagship, 18 mo", source: "repo" },
      { value: "10+", label: "versioned models (Unilever)", source: "repo" },
    ],
    problem:
      "Enterprise FMCG and mobile-financial-services clients needed automated, at-scale verification of point-of-sale material (POSM) placement, planogram compliance, share-of-shelf, and competitor presence across huge outlet networks — work that was previously manual, slow, inconsistent, and impossible to audit at national scale.",
    approach: [
      "Built a central FastAPI inference service that routes each outlet image to campaign-specific YOLO detection/segmentation models (PJ Strike, Autograph, Euphoria, Frost, Luckies, Derby and more for BAT) rather than one monolithic model.",
      "Scored planogram compliance, blanks, and competitor placement, and added face-recognition and NLP modules for field-agent verification and audio brand-mention checks.",
      "Wrote per-client converters mapping AI class names to each client's product IDs and data schemas, plus cross-model reconciliation for Unilever's overlapping detectors (Display Audit, QPDS, SOS, MTSOS).",
      "Deployed from Hugging Face model repos under Hypercorn with async I/O, structured JSON logging, and HTTP-Basic-secured docs for GPU/container hosting.",
    ],
    architecture: {
      pipeline: [
        "Outlet image ingest (async API)",
        "Campaign router → correct YOLO model set",
        "Detection / segmentation + counting",
        "Planogram / SOS / competitor scoring",
        "Per-client converter → product IDs & schema",
        "Structured JSON response + logging",
      ],
      stack: [
        "Python", "FastAPI", "PyTorch", "Ultralytics YOLO",
        "async httpx / asyncio", "Hypercorn", "Git LFS", "Hugging Face deploy", "OpenCV",
      ],
    },
    results: [
      { text: "~99% detection accuracy across a network cited at 2M+ outlets for enterprise FMCG & MFS clients.", source: "cv" },
      { text: "BAT_Master flagship sustained 397 commits over 18 months across 7 branches — a mature, continuously-shipped production system.", source: "repo" },
      { text: "Unilever counterpart runs 10+ versioned YOLO models with cross-model reconciliation; parallel live deployments for Malaysia, Square, and Nagad (MFS branding).", source: "repo" },
    ],
    links: [
      { label: "BAT-Master-Live (Hugging Face)", url: "https://huggingface.co/rakib72642/BAT-Master-Live" },
      { label: "UNILEVER-Master-Live (Hugging Face)", url: "https://huggingface.co/rakib72642/UNILEVER-Master-Live" },
    ],
    related: ["BAT-Master-Live", "UNILEVER-Master-Live", "Malay-DAIA", "Squere_Demo", "Nagad"],
  },
  {
    slug: "real-time-voice-agent",
    title: "Real-Time Conversational Voice Agent",
    subtitle:
      "Browser-based, low-latency spoken AI — WebRTC audio into a streaming STT → agent → TTS loop with tool-calling.",
    context: "HawkEyes · Voice-AI-Agent · most active repo · 2026",
    domain: "LLM, RAG & Conversational AI",
    featured: true,
    tags: ["WebRTC", "LangGraph", "faster-whisper", "edge-tts", "MCP", "FastAPI"],
    metrics: [
      { value: "122", label: "commits · 6 branches", source: "repo" },
      { value: "<latency", label: "parallel TTS + GPU-batched STT", source: "repo" },
      { value: "4+", label: "LLM providers", source: "repo" },
    ],
    problem:
      "Enable natural, low-latency spoken conversation with an LLM assistant directly from the browser — the foundation for production AI agent-driven inbound/outbound telephony (hospital appointment automation, sales, and support agents).",
    approach: [
      "WebRTC-first (WebSocket fallback) audio streaming into a VAD → STT → LangGraph agent → TTS loop.",
      "Per-session checkpointed memory and MCP tool-calling (Twilio, email, dates) so the agent can take real actions.",
      "Multi-provider LLM backends (Ollama / OpenAI / Gemini / Hugging Face) behind one interface.",
      "Explicit latency engineering: parallel TTS, GPU-batched STT, and concurrent LLM+TTS to cut perceived response time.",
    ],
    architecture: {
      pipeline: [
        "Browser mic → WebRTC / WebSocket",
        "Voice Activity Detection (VAD)",
        "STT — faster-whisper / ElevenLabs",
        "LangGraph agent + per-session memory",
        "MCP tool-calls (Twilio, email…)",
        "TTS (edge-tts) → streamed audio back",
      ],
      stack: [
        "Python", "FastAPI", "WebRTC / WebSockets", "LangChain + LangGraph",
        "faster-whisper", "edge-tts", "Ollama / OpenAI / Gemini / HF", "aiosqlite", "MCP", "Twilio",
      ],
    },
    results: [
      { text: "The single most active repository in the portfolio: 122 commits across 6 branches (rakib +88 ElevenLabs STT; dev +82 TTS providers; WebRTC fixes).", source: "repo" },
      { text: "Latency work (parallel TTS, GPU-batched STT, concurrent LLM+TTS) targets real-time telephony use.", source: "repo" },
      { text: "Bangla speech to be supplied by the in-house custom Bangladeshi-accent TTS (see the TTS case study).", source: "repo" },
    ],
    links: [{ label: "Voice-AI-Agent (Hugging Face)", url: "https://huggingface.co/HawkEyesAI/Voice-AI-Agent" }],
    related: ["Voice-AI-Agent", "Hospital-AI-Agent", "AI-ChatBot", "Custom-TTS-Bangla-Accent-VITS-XTTSv2"],
  },
  {
    slug: "agentic-grounded-rag",
    title: "Agentic & Strictly-Grounded RAG",
    subtitle:
      "A self-correcting Planner→Executor→Critic agent over MongoDB, plus strict-grounding RAG over Bangla PDFs.",
    context: "HawkEyes · AI-Agent_MongoDB · HE-Sherlock · 2026",
    domain: "LLM, RAG & Conversational AI",
    featured: true,
    tags: ["LangGraph", "MongoDB Atlas Vector Search", "FAISS", "sentence-transformers", "SSE"],
    metrics: [
      { value: "P→E→C", label: "self-correcting agent loop", source: "repo" },
      { value: "SSE", label: "streaming + full observability", source: "repo" },
      { value: "bn+en", label: "low-resource grounding", source: "repo" },
    ],
    problem:
      "Answer enterprise data questions grounded in a real database — reliably, without hallucination — and do the same over Bangla PDF documents where the model must refuse when the answer isn't in context.",
    approach: [
      "Built a Planner→Executor→Critic→Memory agent loop that generates MongoDB queries / vector searches, evaluates groundedness, and retries within bounds.",
      "Added SSE streaming, pluggable embeddings, and full observability (structured logs + feedback capture).",
      "Companion HE-Sherlock pipeline: PyMuPDF + Tesseract (ben+eng) OCR → FAISS index → Gemini answering under a strict 'answer only from context' prompt that refuses (in Bangla) when the answer is absent.",
      "Simpler sibling (mongoRAG) provides a clean, readable E5-embedding + vector-retrieval baseline.",
    ],
    architecture: {
      pipeline: [
        "Question → Planner (query/search plan)",
        "Executor → MongoDB query / vector search",
        "Retrieve context (Atlas Vector / FAISS)",
        "Critic → groundedness check + retry",
        "Memory + SSE-streamed grounded answer",
      ],
      stack: [
        "Python", "FastAPI", "Motor / PyMongo", "MongoDB Atlas Vector Search",
        "sentence-transformers (E5)", "LangGraph", "FAISS", "PyMuPDF", "Tesseract", "Google Gemini",
      ],
    },
    results: [
      { text: "A complete agentic-RAG reference: query generation, groundedness verification, bounded retries, and observability.", source: "repo" },
      { text: "HE-Sherlock delivers production RAG on a low-resource language end to end, with explicit refusal behavior (22 commits).", source: "repo" },
    ],
    links: [
      { label: "AI-Agent_MongoDB (GitHub)", url: "https://github.com/RH-NAYM/AI-Agent_MongoDB" },
      { label: "HE-Sherlock (Hugging Face)", url: "https://huggingface.co/HawkEyesAI/HE-Sherlock" },
      { label: "mongoRAG (GitHub)", url: "https://github.com/RH-NAYM/mongoRAG" },
    ],
    related: ["AI-Agent_MongoDB", "HE-Sherlock", "mongoRAG", "Langgraph"],
  },
  {
    slug: "bangla-tts",
    title: "Custom Bangladeshi-Accent Bangla TTS",
    subtitle:
      "A VITS text-to-speech model with a grapheme frontend, built to give production voice agents a natural Bangladeshi accent.",
    context: "HawkEyes · Custom-TTS-Bangla-Accent-VITS-XTTSv2 · current focus · 2026",
    domain: "Speech, Audio & NLP",
    featured: true,
    tags: ["Coqui VITS", "PyTorch", "torchaudio", "librosa", "Bangla NLP"],
    metrics: [
      { value: "90", label: "commits · very active", source: "repo" },
      { value: "VITS", label: "+ grapheme frontend", source: "repo" },
      { value: "current", label: "primary focus", source: "cv" },
    ],
    problem:
      "Natural Bangla speech synthesis is a low-resource challenge, and off-the-shelf voices lack a genuine Bangladeshi accent — a blocker for deploying trustworthy AI call agents for hospital appointment automation, sales, and support.",
    approach: [
      "Fine-tune VITS with a purpose-built Bangla text frontend: Unicode NFC normalization, zero-width handling, danda/digit normalization via a grapheme-based approach.",
      "Build the supporting speech-dataset pipeline (genMaxTxt): transcribe with Google Cloud Speech, normalize transcripts with Gemini, and align audio to spreadsheet entries.",
      "Target deployment inside the real-time voice agent for inbound/outbound call automation.",
    ],
    architecture: {
      pipeline: [
        "Raw Bangla audio + text",
        "Grapheme frontend normalization",
        "Dataset preprocessing (genMaxTxt)",
        "VITS fine-tuning (PyTorch/torchaudio)",
        "TensorBoard monitoring",
        "Serve into Voice-AI-Agent TTS stage",
      ],
      stack: [
        "Python", "Coqui TTS (VITS)", "PyTorch / torchaudio", "librosa",
        "bnnumerizer / bnunicodenormalizer", "TensorBoard",
      ],
    },
    results: [
      { text: "An end-to-end Bangla TTS recipe under very active development (90 commits) — the author's current primary focus.", source: "repo" },
      { text: "Designed to plug directly into the production voice agent to unlock Bangla telephony automation.", source: "cv" },
    ],
    links: [
      { label: "Custom-TTS-Bangla-Accent-VITS-XTTSv2 (Hugging Face)", url: "https://huggingface.co/rakib72642/Custom-TTS-Bangla-Accent-VITS-XTTSv2" },
      { label: "genMaxTxt (GitHub)", url: "https://github.com/RH-NAYM/genMaxTxt" },
    ],
    related: ["Custom-TTS-Bangla-Accent-VITS-XTTSv2", "genMaxTxt", "Voice-AI-Agent"],
  },
  {
    slug: "on-prem-gpu-infra",
    title: "On-Prem AI Server Infrastructure",
    subtitle:
      "Two self-hosted Ubuntu GPU servers, designed and built in-house — an alternative to renting cloud GPUs.",
    context: "HawkEyes · internal infrastructure + vastai-automate · 2025–present",
    domain: "MLOps, Infrastructure & Tooling",
    featured: true,
    tags: ["Ubuntu Server", "Linux (Arch)", "NVIDIA GPU", "Docker", "Bash", "Vast.ai"],
    metrics: [
      { value: "2", label: "on-prem GPU servers", source: "cv" },
      { value: "3+ yrs", label: "Arch Linux daily driver", source: "cv" },
      { value: "in-house", label: "vs rented cloud GPU", source: "cv" },
    ],
    problem:
      "Relying on rented cloud GPUs for hosting AI services and training models is costly and adds an external dependency the team can't fully control.",
    approach: [
      "Designed, built, and administer two dedicated on-premises Ubuntu servers — hardware provisioning, Linux server setup, containerized deployment, and ongoing maintenance.",
      "Host most of the team's production AI workloads and run model-training jobs in-house.",
      "Complement on-prem capacity with vastai-automate: scripts that search Vast.ai offers under hardware/network/reliability constraints, rank by price/throughput/reliability, auto-select the best instances, and bootstrap the environment.",
    ],
    architecture: {
      pipeline: [
        "Bare-metal provisioning + Ubuntu server setup",
        "NVIDIA GPU drivers + Docker runtime",
        "Containerized AI services + training jobs",
        "Structured logging & maintenance",
        "Burst to Vast.ai via ranked auto-provisioning",
      ],
      stack: ["Ubuntu Server", "Linux (Arch)", "NVIDIA GPU", "Docker & Compose", "Bash", "Python", "Vast.ai CLI"],
    },
    results: [
      { text: "Reduced dependence on rented cloud GPUs and gave the team full control over training and inference infrastructure.", source: "cv" },
      { text: "Built and maintained by a long-time Linux power user (Arch daily driver 3+ years; hands-on across Ubuntu, Fedora, Mint, Pop!_OS).", source: "cv" },
    ],
    links: [{ label: "vastai-automate (GitHub)", url: "https://github.com/RH-NAYM/vastai-automate" }],
    related: ["vastai-automate", "DockerLessons", "important_files", "custom-fastfetch"],
  },
  {
    slug: "bangla-ocr-icr",
    title: "Bangla OCR / ICR Engine",
    subtitle:
      "End-to-end custom PyTorch intelligent character recognition for the low-resource Bangla script.",
    context: "HawkEyes · Bangla-ICR · 2025",
    domain: "OCR & Document Intelligence",
    featured: true,
    tags: ["PyTorch", "CNN + CTC", "OpenCV", "scikit-learn", "synthetic data"],
    metrics: [
      { value: "CRNN", label: "CNN feature + CTC decode", source: "repo" },
      { value: "Bangla", label: "low-resource script", source: "repo" },
      { value: "REST", label: "API-served", source: "cv" },
    ],
    problem:
      "Reading Bangla text is under-served by mainstream OCR engines, blocking automated understanding of Bangla documents and forms.",
    approach: [
      "Built an end-to-end PyTorch OCR/ICR model: a CNN feature extractor with sequence decoding under a CTC-style objective and Levenshtein-based evaluation.",
      "Generated synthetic training data and assembled a custom dataset to overcome the low-resource gap.",
      "Complemented by a detection-driven field-extraction demo (DemoOCRBangla) and a hybrid Cloud Vision + Gemini OCR pipeline (OCR_CloudVision_Gemeni) for noisy real-world images.",
    ],
    architecture: {
      pipeline: [
        "Document image → preprocessing (OpenCV)",
        "Optional YOLO field localization",
        "CNN feature extractor",
        "Sequence decoding (CTC)",
        "Levenshtein evaluation → text output (REST)",
      ],
      stack: ["Python", "PyTorch", "OpenCV", "scikit-learn", "Pillow", "python-Levenshtein"],
    },
    results: [
      { text: "Directly addresses the low-resource-language OCR challenge with a custom, from-scratch CRNN+CTC pipeline and synthetic data.", source: "repo" },
      { text: "Served as a REST API and paired with hybrid classical-OCR + LLM extraction for messy inputs.", source: "cv" },
    ],
    links: [
      { label: "Bangla-ICR (GitHub)", url: "https://github.com/RH-NAYM/Bangla-ICR" },
      { label: "OCR_CloudVision_Gemeni (HF)", url: "https://huggingface.co/HawkEyesAI/OCR_CloudVision_Gemeni" },
    ],
    related: ["Bangla-ICR", "DemoOCRBangla", "OCR_CloudVision_Gemeni"],
  },
  {
    slug: "hospital-ai-agent",
    title: "Hospital Appointment AI Agent",
    subtitle:
      "A Gemini-Live voice & chat assistant that carries a real multi-turn conversation to book, confirm, and manage hospital appointments.",
    context: "HawkEyes · Hospital-AI-Agent · Gemini Live + LangGraph · 2026",
    domain: "LLM, RAG & Conversational AI",
    featured: true,
    tags: ["Gemini Live", "LangGraph", "WebRTC", "Twilio", "RVC", "FastAPI"],
    metrics: [
      { value: "LangGraph", label: "stateful appointment-booking core", source: "repo" },
      { value: "2", label: "interchangeable voice backends", source: "repo" },
      { value: "Twilio+Email", label: "real confirmation actions", source: "repo" },
    ],
    problem:
      "Hospital front-desk appointment booking over phone or chat is repetitive, staff-intensive, and error-prone — it needs an agent that can hold a genuine multi-turn conversation, track slot-filling (doctor, date, time), stay strictly on-topic, and take real actions rather than just talk.",
    approach: [
      "Built a LangGraph state-machine agent (persona 'তানিয়া ইসলাম') that tracks slot memory across turns — doctor selection, natural-language date/time parsing (dateparser), and domain-strict guardrails that keep the conversation on-topic.",
      "Added a dedicated Gemini Live bridge alongside the existing STT→LLM→TTS pipeline so the same appointment tools, prompts, and conversation state can drive either native Gemini Live audio or the classic loop — an interchangeable-backend design.",
      "Delivered both a WebRTC voice transport and a text/chat transport from one FastAPI backend, with Twilio call/SMS and email tool-calling for appointment confirmations.",
      "Added an internal RVC (voice-conversion) module and a lightweight DB-view/admin API for operational visibility into bookings.",
    ],
    architecture: {
      pipeline: [
        "Caller/browser audio or chat → FastAPI transport (WebRTC / WebSocket / REST)",
        "VAD → STT, or native Gemini Live audio",
        "LangGraph agent — slot memory + domain-strict guardrails",
        "Tool-calls: doctor/date lookup, Twilio call/SMS, email confirmation",
        "TTS or Gemini Live audio response streamed back",
        "aiosqlite-checkpointed conversation state + DB-view admin API",
      ],
      stack: [
        "Python", "FastAPI", "LangChain + LangGraph", "langchain-google-genai (Gemini Live)",
        "Twilio", "aiosqlite", "dateparser", "RVC", "WebRTC",
      ],
    },
    results: [
      { text: "Runs two interchangeable generation backends — native Gemini Live audio and a classic STT→LLM→TTS loop — behind one appointment-booking agent core.", source: "repo" },
      { text: "Takes real-world action (Twilio call/SMS and email confirmations), not just conversation, on top of a domain-strict, slot-memory LangGraph core.", source: "repo" },
    ],
    links: [{ label: "Hospital-AI-Agent (Hugging Face)", url: "https://huggingface.co/rakib72642/Hospital-AI-Agent" }],
    related: ["Hospital-AI-Agent", "Voice-AI-Agent", "Custom-TTS-Bangla-Accent-VITS-XTTSv2"],
  },
  {
    slug: "he-universe-model-store",
    title: "HE-Universe Multi-Domain AI Model Store",
    subtitle:
      "One FastAPI service unifying 15+ production AI modules — retail CV, face recognition, OCR, and conversational NLP — behind a single deployable Hugging Face Space.",
    context: "HawkEyes · Universe-Model-Store (formerly v2_HE_Universe) · 2025–present",
    domain: "Computer Vision & Retail Intelligence",
    featured: true,
    tags: ["FastAPI", "YOLO", "OCR", "NLP", "face_recognition", "Hugging Face", "multi-module"],
    metrics: [
      { value: "15+", label: "production modules in one service", source: "repo" },
      { value: "BAT+UBL", label: "+ OCR, face, NLP, speech modules", source: "repo" },
      { value: "1", label: "unified deploy (Hugging Face)", source: "repo" },
    ],
    problem:
      "As the number of client programs grew (BAT, Unilever, OCR, face verification, speech), running each as a fully separate service became an operational burden — duplicated boilerplate, scattered deployments, and no single place to reason about the whole model estate.",
    approach: [
      "Consolidated BAT, Unilever (UBL), face detection/recognition, Bangla & 'MT House' OCR, material detection, beverage-industry detection, hotspot calculation, eKYC, and five NLP/conversational modules (general NLP, Zerocal, Maya, conversational guidance, speak-metric merge) behind one FastAPI app (Universe_API.py).",
      "Kept each domain in its own class/module boundary (modules/<name>/<name>_main.py) while sharing a common tools/model-handler layer for loading and serving models.",
      "Deployed as a single Hugging Face Space so every client-facing capability the team ships can be reached from one live endpoint instead of a dozen scattered ones.",
    ],
    architecture: {
      pipeline: [
        "Request → Universe_API.py router",
        "Domain class dispatch (BAT / UBL / OCR / Face / NLP / Speech …)",
        "Shared model-handler loads the right model set",
        "Per-module inference + response shaping",
        "Structured JSON response + per-module logs",
      ],
      stack: [
        "Python", "FastAPI", "PyTorch", "Ultralytics YOLO", "OpenCV",
        "Tesseract / OCR", "face_recognition", "NLTK", "Hugging Face deploy", "Git LFS",
      ],
    },
    results: [
      { text: "One live Hugging Face Space now fronts 15+ previously-separate production modules spanning retail CV, OCR, identity, and conversational NLP.", source: "repo" },
      { text: "Gives the team a single place to add, version, and monitor new AI capabilities instead of standing up a new service per client.", source: "cv" },
    ],
    links: [{ label: "Universe-Model-Store (Hugging Face)", url: "https://huggingface.co/rakib72642/Universe-Model-Store" }],
    related: ["Universe-Model-Store", "BAT-Master-Live", "UNILEVER-Master-Live"],
  },
];

// ─── Full repository index (all 56) ──────────────────────────────────────────
export type Repo = {
  name: string;
  description: string;
  url: string;
  tags: string[];
  domain: string;
  caseStudy?: string; // slug if it belongs to a featured case study
};

export const domains = [
  "Computer Vision & Retail Intelligence",
  "Identity & Face Verification",
  "OCR & Document Intelligence",
  "LLM, RAG & Conversational AI",
  "Speech, Audio & NLP",
  "MLOps, Infrastructure & Tooling",
  "Web, Backend & Systems",
  "OpenCV Fundamentals",
] as const;

export const repos: Repo[] = [
  // Computer Vision & Retail Intelligence
  { name: "BAT-Master-Live", description: "Central production CV+analytics API for a British American Tobacco retail-execution program — live Hugging Face deployment (merges the BAT_Master flagship and its earliest prototype lineage).", url: "https://huggingface.co/rakib72642/BAT-Master-Live", tags: ["FastAPI", "YOLO", "PyTorch", "Hypercorn", "Hugging Face"], domain: "Computer Vision & Retail Intelligence", caseStudy: "retail-execution-intelligence" },
  { name: "UNILEVER-Master-Live", description: "Unilever Bangladesh retail-execution API — 10+ versioned YOLO models with cross-model reconciliation (Display Audit, QPDS, SOS, MTSOS), live Hugging Face deployment.", url: "https://huggingface.co/rakib72642/UNILEVER-Master-Live", tags: ["FastAPI", "YOLO", "dlib", "Docker", "Hugging Face"], domain: "Computer Vision & Retail Intelligence", caseStudy: "retail-execution-intelligence" },
  { name: "Malay-DAIA", description: "Retail item-detection + agent face-verification API for a Malaysian deployment.", url: "https://huggingface.co/HawkEyesAI/Malay-DAIA", tags: ["FastAPI", "YOLO", "face_recognition"], domain: "Computer Vision & Retail Intelligence", caseStudy: "retail-execution-intelligence" },
  { name: "Squere_Demo", description: "Multi-module retail-audit API: Display Audit, POSM, Sachet, and Share-of-Shelf.", url: "https://huggingface.co/HawkEyesAI/Squere_Demo", tags: ["FastAPI", "YOLO", "OpenCV", "async"], domain: "Computer Vision & Retail Intelligence", caseStudy: "retail-execution-intelligence" },
  { name: "Nagad", description: "Mobile-financial-services (Nagad/bKash/Rocket/Tap) branding detection API.", url: "https://github.com/RH-NAYM/Nagad", tags: ["FastAPI", "YOLO", "pandas"], domain: "Computer Vision & Retail Intelligence", caseStudy: "retail-execution-intelligence" },
  { name: "nagad_version_12", description: "Versioned (v12) snapshot of the Nagad detection API.", url: "https://github.com/RH-NAYM/nagad_version_12", tags: ["FastAPI", "YOLO"], domain: "Computer Vision & Retail Intelligence" },
  { name: "GP_HawkEyes", description: "Async object-detection & counting microservice (reusable detection pattern).", url: "https://github.com/RH-NAYM/GP_HawkEyes", tags: ["FastAPI", "YOLOv5", "asyncio"], domain: "Computer Vision & Retail Intelligence" },
  { name: "distance-calculate", description: "Object distance/spacing estimation from detections (pixel-to-metric).", url: "https://huggingface.co/HawkEyesAI/distance-calculate", tags: ["FastAPI", "YOLO", "NumPy"], domain: "Computer Vision & Retail Intelligence" },
  { name: "Hypothesis-for-detect-common-competitor-products", description: "Competitor-product detection experiment (YOLO + Gemini vision).", url: "https://huggingface.co/HawkEyesAI/Hypothesis-for-detect-common-competitor-products", tags: ["FastAPI", "YOLO", "Gemini"], domain: "Computer Vision & Retail Intelligence" },
  { name: "Himel_Face_Detection", description: "Team recognition + directory-lookup API.", url: "https://github.com/RH-NAYM/Himel_Face_Detection", tags: ["FastAPI", "YOLOv5", "pandas"], domain: "Computer Vision & Retail Intelligence" },
  { name: "Demo_AR", description: "Browser AR camera demo (WebSocket + OpenCV) — maps to the AR validation tool.", url: "https://github.com/RH-NAYM/Demo_AR", tags: ["FastAPI", "WebSockets", "OpenCV"], domain: "Computer Vision & Retail Intelligence" },
  { name: "Universe-Model-Store", description: "Multi-module AI model store/API unifying BAT, Unilever, face recognition, OCR, and conversational-NLP services behind one Hugging Face deployment.", url: "https://huggingface.co/rakib72642/Universe-Model-Store", tags: ["FastAPI", "YOLO", "OCR", "NLP", "multi-module", "Hugging Face"], domain: "Computer Vision & Retail Intelligence", caseStudy: "he-universe-model-store" },

  // Identity & Face Verification
  { name: "NID-Face-Validation-with-AI", description: "Identity verification by matching a selfie against an NID photo (face embeddings).", url: "https://github.com/RH-NAYM/NID-Face-Validation-with-AI", tags: ["FastAPI", "face_recognition", "dlib"], domain: "Identity & Face Verification" },
  { name: "Face_Matching_with_Python", description: "Two-image face verification API (dlib encodings).", url: "https://github.com/RH-NAYM/Face_Matching_with_Python", tags: ["FastAPI", "face_recognition", "dlib"], domain: "Identity & Face Verification" },
  { name: "Face-Detection", description: "Real-time face & landmark detection (OpenCV + MediaPipe Holistic).", url: "https://github.com/RH-NAYM/Face-Detection", tags: ["OpenCV", "MediaPipe"], domain: "Identity & Face Verification" },

  // OCR & Document Intelligence
  { name: "Bangla-ICR", description: "Custom PyTorch Bangla intelligent character recognition (CNN + CTC).", url: "https://github.com/RH-NAYM/Bangla-ICR", tags: ["PyTorch", "OpenCV", "CTC"], domain: "OCR & Document Intelligence", caseStudy: "bangla-ocr-icr" },
  { name: "DemoOCRBangla", description: "Detection-driven OCR field-extraction demo (detect-then-read).", url: "https://github.com/RH-NAYM/DemoOCRBangla", tags: ["FastAPI", "YOLO", "OCR"], domain: "OCR & Document Intelligence", caseStudy: "bangla-ocr-icr" },
  { name: "OCR_CloudVision_Gemeni", description: "Hybrid OCR: Google Cloud Vision + Gemini 1.5 Flash + NLTK.", url: "https://huggingface.co/HawkEyesAI/OCR_CloudVision_Gemeni", tags: ["Cloud Vision", "Gemini", "NLTK"], domain: "OCR & Document Intelligence", caseStudy: "bangla-ocr-icr" },

  // LLM, RAG & Conversational AI
  { name: "Voice-AI-Agent", description: "Production real-time conversational voice agent (WebRTC → STT → LangGraph → TTS).", url: "https://huggingface.co/HawkEyesAI/Voice-AI-Agent", tags: ["WebRTC", "LangGraph", "faster-whisper", "MCP"], domain: "LLM, RAG & Conversational AI", caseStudy: "real-time-voice-agent" },
  { name: "Hospital-AI-Agent", description: "Hospital appointment-booking voice & chat agent — LangGraph slot-memory core with a Gemini Live audio bridge, Twilio/email tool-calling, and WebRTC transport.", url: "https://huggingface.co/rakib72642/Hospital-AI-Agent", tags: ["Gemini Live", "LangGraph", "Twilio", "WebRTC", "FastAPI"], domain: "LLM, RAG & Conversational AI", caseStudy: "hospital-ai-agent" },
  { name: "AI-Agent_MongoDB", description: "Multi-agent, self-correcting RAG over MongoDB (Planner→Executor→Critic).", url: "https://github.com/RH-NAYM/AI-Agent_MongoDB", tags: ["LangGraph", "MongoDB", "SSE"], domain: "LLM, RAG & Conversational AI", caseStudy: "agentic-grounded-rag" },
  { name: "mongoRAG", description: "Clean MongoDB retrieval-augmented-generation pipeline (E5 embeddings).", url: "https://github.com/RH-NAYM/mongoRAG", tags: ["FastAPI", "MongoDB", "sentence-transformers"], domain: "LLM, RAG & Conversational AI", caseStudy: "agentic-grounded-rag" },
  { name: "HE-Sherlock", description: "Bangla document RAG Q&A with strict grounding (FAISS + Gemini).", url: "https://huggingface.co/HawkEyesAI/HE-Sherlock", tags: ["LangChain", "FAISS", "Gemini", "Tesseract"], domain: "LLM, RAG & Conversational AI", caseStudy: "agentic-grounded-rag" },
  { name: "Langgraph", description: "LangGraph learning notebooks & agent-workflow experiments.", url: "https://github.com/RH-NAYM/Langgraph", tags: ["LangGraph", "Jupyter"], domain: "LLM, RAG & Conversational AI" },
  { name: "imiBotAI", description: "Intent chatbot dispatching to operational data functions (UBL variants).", url: "https://github.com/RH-NAYM/imiBotAI", tags: ["PyTorch", "NLTK", "FastAPI"], domain: "LLM, RAG & Conversational AI" },
  { name: "ChatBot_for_Excel", description: "Intent-classification chatbot over spreadsheet data (bag-of-words).", url: "https://github.com/RH-NAYM/ChatBot_for_Excel", tags: ["PyTorch", "NLTK"], domain: "LLM, RAG & Conversational AI" },
  { name: "Rule_Based_Bot", description: "Rule-based & TF-IDF retrieval chatbots (pre-LLM techniques).", url: "https://github.com/RH-NAYM/Rule_Based_Bot", tags: ["NLTK", "scikit-learn"], domain: "LLM, RAG & Conversational AI" },
  { name: "TeleBotAI", description: "Async Telegram service bot with inline menus & encrypted config.", url: "https://github.com/RH-NAYM/TeleBotAI", tags: ["Telegram", "httpx", "cryptography"], domain: "LLM, RAG & Conversational AI" },
  { name: "AI-ChatBot", description: "Local, GPU-accelerated voice assistant loop (whisper → local LLM → TTS).", url: "https://github.com/RH-NAYM/AI-ChatBot", tags: ["faster-whisper", "Transformers", "llama.cpp"], domain: "LLM, RAG & Conversational AI" },

  // Speech, Audio & NLP
  { name: "Custom-TTS-Bangla-Accent-VITS-XTTSv2", description: "Bangla text-to-speech fine-tuning (Coqui VITS + grapheme frontend, expanding toward XTTSv2).", url: "https://huggingface.co/rakib72642/Custom-TTS-Bangla-Accent-VITS-XTTSv2", tags: ["Coqui VITS", "PyTorch", "librosa", "XTTSv2"], domain: "Speech, Audio & NLP", caseStudy: "bangla-tts" },
  { name: "genMaxTxt", description: "Speech-to-text dataset builder (Cloud Speech + Gemini normalization).", url: "https://github.com/RH-NAYM/genMaxTxt", tags: ["Cloud Speech", "Gemini", "openpyxl"], domain: "Speech, Audio & NLP", caseStudy: "bangla-tts" },
  { name: "BAT_Audio_NLP", description: "Audio brand-mention detection for BAT (AssemblyAI + fuzzy regex).", url: "https://github.com/RH-NAYM/BAT_Audio_NLP", tags: ["AssemblyAI", "regex"], domain: "Speech, Audio & NLP" },
  { name: "BAT_NLP_Campaign", description: "Campaign-phrase compliance detection from field audio (NLTK + fuzzy match).", url: "https://github.com/RH-NAYM/BAT_NLP_Campaign", tags: ["AssemblyAI", "NLTK", "regex"], domain: "Speech, Audio & NLP" },

  // MLOps, Infrastructure & Tooling
  { name: "On-Prem AI Server Infrastructure", description: "Two self-hosted Ubuntu GPU servers hosting production AI + training (internal).", url: "https://github.com/RH-NAYM", tags: ["Ubuntu", "NVIDIA GPU", "Docker", "Bash"], domain: "MLOps, Infrastructure & Tooling", caseStudy: "on-prem-gpu-infra" },
  { name: "vastai-automate", description: "GPU instance selection & provisioning automation (Vast.ai cost optimization).", url: "https://github.com/RH-NAYM/vastai-automate", tags: ["Bash", "Python", "Vast.ai"], domain: "MLOps, Infrastructure & Tooling", caseStudy: "on-prem-gpu-infra" },
  { name: "DockerLessons", description: "Docker & containerization practice (Compose, cheat sheet).", url: "https://github.com/RH-NAYM/DockerLessons", tags: ["Docker", "FastAPI"], domain: "MLOps, Infrastructure & Tooling" },
  { name: "important_files", description: "ML/CV engineering toolbox — dataset prep, YOLO annotation, training utils.", url: "https://github.com/RH-NAYM/important_files", tags: ["PyTorch", "OpenCV", "Label Studio"], domain: "MLOps, Infrastructure & Tooling" },
  { name: "custom-fastfetch", description: "Fastfetch config presets & ASCII art (Arch / Hyprland dotfiles).", url: "https://github.com/RH-NAYM/custom-fastfetch", tags: ["Arch Linux", "Hyprland", "JSONC"], domain: "MLOps, Infrastructure & Tooling" },

  // Web, Backend & Systems
  { name: "AttendanceHE", description: "Hybrid IP-gated attendance system (internal production) — Fernet-encrypted creds.", url: "https://github.com/RH-NAYM/AttendanceHE", tags: ["FastAPI", "Google Sheets", "Docker"], domain: "Web, Backend & Systems" },
  { name: "demoDjangoRestAPI", description: "Django REST API demo + Python client.", url: "https://github.com/RH-NAYM/demoDjangoRestAPI", tags: ["Django", "DRF"], domain: "Web, Backend & Systems" },
  { name: "Ldjango", description: "First Django project (StudyBud discussion-rooms clone).", url: "https://github.com/RH-NAYM/Ldjango", tags: ["Django", "SQLite"], domain: "Web, Backend & Systems" },
  { name: "testDjango", description: "Django practice sandbox (models/views/URLs/templates).", url: "https://github.com/RH-NAYM/testDjango", tags: ["Django", "SQLite"], domain: "Web, Backend & Systems" },
  { name: "Learn_HTML", description: "HTML/CSS learning lessons (numbered, per-page stylesheets).", url: "https://github.com/RH-NAYM/Learn_HTML", tags: ["HTML5", "CSS"], domain: "Web, Backend & Systems" },
  { name: "Getting_Started_with_MongoDB", description: "MongoDB setup & usage notes underpinning the DB-backed projects.", url: "https://github.com/RH-NAYM/Getting_Started_with_MongoDB", tags: ["MongoDB"], domain: "Web, Backend & Systems" },
  { name: "LeetCode_Probs", description: "Algorithm practice — LeetCode solutions in notebooks.", url: "https://github.com/RH-NAYM/LeetCode_Probs", tags: ["Python", "Jupyter"], domain: "Web, Backend & Systems" },
  { name: "Personal-Content", description: "Personal configuration store (reusable setup bundle).", url: "https://github.com/RH-NAYM/Personal-Content", tags: ["Config"], domain: "Web, Backend & Systems" },

  // OpenCV Fundamentals
  { name: "OpenCV-Convolution", description: "Image filtering via convolution — blur, sharpen, edge detection.", url: "https://github.com/RH-NAYM/OpenCV-Convolution", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Image-Thresholding", description: "Global, adaptive & Otsu thresholding for binarization/segmentation.", url: "https://github.com/RH-NAYM/OpenCV-Image-Thresholding", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Morphological-Transformations", description: "Erosion, dilation, opening, closing, gradient & hat operations.", url: "https://github.com/RH-NAYM/OpenCV-Morphological-Transformations", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Histogram-Equalization", description: "Contrast enhancement — global equalization & adaptive CLAHE.", url: "https://github.com/RH-NAYM/OpenCV-Histogram-Equalization", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Vanishing-Point-Detection", description: "Vanishing-point detection (Canny + Hough + RANSAC).", url: "https://github.com/RH-NAYM/OpenCV-Vanishing-Point-Detection", tags: ["OpenCV", "RANSAC"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Homography-Perspective-Transform", description: "Homography & perspective warping with interactive click-to-warp.", url: "https://github.com/RH-NAYM/OpenCV-Homography-Perspective-Transform", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Camera-Calibration---Lens-Distortion", description: "Chessboard calibration & lens-distortion correction (intrinsics).", url: "https://github.com/RH-NAYM/OpenCV-Camera-Calibration---Lens-Distortion", tags: ["OpenCV", "calibration"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Affine-Transformation", description: "Affine transforms — translation, rotation, scale, shear.", url: "https://github.com/RH-NAYM/OpenCV-Affine-Transformation", tags: ["OpenCV", "NumPy"], domain: "OpenCV Fundamentals" },
  { name: "OpenCV-Feature-Detection-and-Matching", description: "Feature matching from classical keypoints up to GPU LightGlue.", url: "https://github.com/RH-NAYM/OpenCV-Feature-Detection-and-Matching", tags: ["OpenCV", "LightGlue", "CUDA"], domain: "OpenCV Fundamentals" },
];
