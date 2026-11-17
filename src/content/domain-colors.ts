// Annotation palette: every AI domain owns one color, the way a labeling
// tool colors classes. Used for category tags, filter chips and the
// detection-style outline on case-study cards. Values live in globals.css.
const map: Record<string, { color: string; short: string }> = {
  "Computer Vision & Retail Intelligence": { color: "var(--c-cv)", short: "computer vision" },
  "Identity & Face Verification": { color: "var(--c-face)", short: "face & identity" },
  "OCR & Document Intelligence": { color: "var(--c-ocr)", short: "ocr & documents" },
  "LLM, RAG & Conversational AI": { color: "var(--c-llm)", short: "llm & agents" },
  "Speech, Audio & NLP": { color: "var(--c-speech)", short: "speech & audio" },
  "MLOps, Infrastructure & Tooling": { color: "var(--c-infra)", short: "mlops & infra" },
  "Web, Backend & Systems": { color: "var(--c-web)", short: "backend" },
  "OpenCV Fundamentals": { color: "var(--c-opencv)", short: "opencv" },
  "AI Products (Bikolpo AI)": { color: "var(--c-product)", short: "ai products" },
};

export function domainStyle(domain: string) {
  return map[domain] ?? { color: "var(--color-accent)", short: domain.toLowerCase() };
}
