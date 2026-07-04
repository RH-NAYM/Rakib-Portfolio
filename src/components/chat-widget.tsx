"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi — I'm Rakib's AI assistant. Ask me about his production computer-vision work, RAG/agent systems, the Bangla TTS project, or how to get in touch.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: next.slice(1).slice(-10), // drop greeting, keep recent
        }),
      });
      const json = await res.json();
      const errorText = json.error
        ? json.detail
          ? `${json.error}\n\n[dev detail] ${json.detail}`
          : json.error
        : null;
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            json.reply ||
            errorText ||
            "The assistant is unavailable right now — please reach out via the contact form.",
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again or use the contact form." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[--color-accent] text-black shadow-lg transition-transform hover:scale-105 glow-accent"
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-[--color-border-strong] bg-[--color-bg-elevated] shadow-2xl ring-1 ring-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-[--color-border] bg-[--color-surface] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-accent-soft] text-[--color-accent]">
              <Bot size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[--color-text]">Rakib&apos;s AI Assistant</p>
              <p className="text-xs text-[--color-text-faint]">Powered by Vertex AI</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[--color-accent] text-black"
                    : "bg-[--color-surface] text-[--color-text-muted]"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-[--color-surface] px-3.5 py-2.5 text-sm text-[--color-text-faint]">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <div className="border-t border-[--color-border] p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about Rakib's work…"
                className="flex-1 rounded-lg border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] outline-none placeholder:text-[--color-text-faint] focus:border-[--color-accent]"
              />
              <button
                onClick={send}
                disabled={loading}
                aria-label="Send"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-accent] text-black disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
