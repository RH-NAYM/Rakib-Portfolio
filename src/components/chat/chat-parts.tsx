"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, Pause, Play, RotateCcw, UserRound, X } from "lucide-react";
import { profile, socials } from "@/content/site";
import { splitCitations, type Media, type Source, type Trace } from "@/lib/twin-events";
import { t, type UiLang } from "./strings";
import { plainText, type Msg } from "./thread-store";
import type { SpeechState } from "./use-speech";

export const AVATAR = "/twin-avatar.webp"; // 256px face crop of profile-photos/photo-3.jpg (design 7A)
const BENGALI = /[ঀ-৿]/;
export const langAttr = (text: string): "bn" | undefined => (BENGALI.test(text) ? "bn" : undefined);

export function Avatar({ size }: { size: 28 | 36 | 56 }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <Image src={AVATAR} alt="" width={size} height={size} className="h-full w-full rounded-full object-cover" />
      <span aria-hidden className="absolute -bottom-0.5 -right-1 rounded-[4px] bg-[--color-bg] px-[3px] text-[9px] font-bold leading-[12px] text-[--color-accent] ring-1 ring-[--color-accent-soft]">
        AI
      </span>
    </span>
  );
}

/* ── citations (design 5B) ─────────────────────────────────────────────────── */
export function Citations({ text, sources }: { text: string; sources?: Source[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const parts = useMemo(() => splitCitations(text), [text]);
  const src = (n: number) => sources?.find((s) => s.n === n);
  return (
    <>
      {parts.map((p, i) =>
        "text" in p ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span key={i} className="relative">
            <button
              type="button"
              className="mx-[1px] align-super text-[0.7em] font-semibold text-[--color-accent] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[--color-accent]"
              aria-label={`Source ${p.cite}${src(p.cite) ? `: ${src(p.cite)!.title}` : ""}`}
              aria-expanded={open === p.cite}
              onClick={() => setOpen(open === p.cite ? null : p.cite)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
            >
              {p.cite}
            </button>
            {open === p.cite && src(p.cite) && (
              <span role="dialog" className="absolute bottom-full left-0 z-10 mb-1 block w-56 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-2 text-xs">
                <span className="block font-semibold text-[--color-text]">{src(p.cite)!.title}</span>
                {src(p.cite)!.url && (
                  <a className="mt-1 block truncate text-[--color-accent] underline" href={src(p.cite)!.url}>
                    {src(p.cite)!.url.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </span>
            )}
          </span>
        ),
      )}
    </>
  );
}

/* ── "How I answered" trace (1b) ──────────────────────────────────────────── */
export function TraceBody({ trace, sources, lang }: { trace: Trace; sources?: Source[]; lang: UiLang }) {
  return (
    <div className="space-y-2 text-xs text-[--color-text-muted]" data-testid="trace">
      {trace.plan.length > 0 && (
        <div>
          <p className="font-semibold uppercase tracking-wide text-[--color-text-muted]">{t("plan", lang)}</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4 font-[family-name:var(--font-code)]">
            {trace.plan.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
      {sources && sources.length > 0 && (
        <div>
          <p className="font-semibold uppercase tracking-wide">{t("sources", lang)}</p>
          <ul className="mt-1 space-y-0.5">
            {sources.map((s) => (
              <li key={s.n}>
                <span className="text-[--color-accent]">{s.n}</span>{" "}
                {s.url ? (
                  <a href={s.url} className="underline underline-offset-2 hover:text-[--color-text]">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="font-semibold uppercase tracking-wide">{t("factCheck", lang)}</p>
        <p className="mt-1">
          {trace.critic.passed ? (
            <span className="text-[--color-success]">✓ {t("allSupported", lang)}</span>
          ) : (
            t("removedClaims", lang, { n: trace.critic.removed_sentences })
          )}{" "}
          · {t("revisions", lang)}: {trace.revisions} · {(trace.elapsed_ms / 1000).toFixed(1)}s
        </p>
      </div>
    </div>
  );
}

/* ── image group + lightbox (design 7D) ───────────────────────────────────── */
export function MediaGroup({ media, lang, onOpen }: { media: Media[]; lang: UiLang; onOpen: (i: number) => void }) {
  const shown = media.slice(0, 4);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  return (
    <div className={`mt-2 grid gap-1 ${shown.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {shown.map((m, i) => (
        <button key={m.id} type="button" onClick={() => onOpen(i)} className="relative block overflow-hidden rounded-xl border border-[--color-border] text-left" aria-label={m.caption}>
          {broken[m.id] ? (
            <span className="flex aspect-video w-full flex-col items-center justify-center bg-[--color-surface-2] p-2 text-xs text-[--color-text-muted]">
              {t("imageUnavailable", lang)} · {m.caption}
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.src} alt={m.alt ?? m.caption} className="aspect-video w-full object-cover" loading="lazy" onError={() => setBroken((b) => ({ ...b, [m.id]: true }))} />
          )}
          {i === 3 && media.length > 4 && (
            <span className="absolute inset-0 flex items-center justify-center bg-[--color-bg]/70 text-lg font-semibold text-[--color-text]">+{media.length - 4}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Lightbox({ media, start, lang, onClose }: { media: Media[]; start: number; lang: UiLang; onClose: () => void }) {
  const [i, setI] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = (d: number) => setI((v) => (v + d + media.length) % media.length);
  useEffect(() => {
    opener.current = document.activeElement;
    ref.current?.focus();
    return () => (opener.current as HTMLElement | null)?.focus?.();
  }, []);
  const m = media[i];
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={m.caption}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-[--color-bg]/95 outline-none"
      onKeyDown={(e) => {
        // Esc closes only the viewer: stop it reaching the panel's window-level Esc handler.
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "Tab") {
          // focus trap (design 6C)
          const f = ref.current?.querySelectorAll<HTMLElement>("button, a[href]");
          if (!f?.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
        if (dy > 90 && Math.abs(dx) < 60) onClose();
        else if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex justify-end p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} aria-label={t("closeViewer", lang)} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text]">
          <X size={22} aria-hidden />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt ?? m.caption} className="max-h-full max-w-full rounded-lg object-contain" />
        {media.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("prev", lang)} className="absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[--color-bg-elevated] text-[--color-text]">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("next", lang)} className="absolute right-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[--color-bg-elevated] text-[--color-text]">
              <ChevronRight size={20} aria-hidden />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm">
        <p className="text-[--color-text]">
          {m.caption} {media.length > 1 && <span className="text-[--color-text-muted]">· {i + 1}/{media.length}</span>}
        </p>
        {m.project_url && (
          <a href={m.project_url} className="shrink-0 text-[--color-accent] underline underline-offset-2">
            {t("openProject", lang)}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── voice (design 7B) ────────────────────────────────────────────────────── */
export function Waveform({ bars, progress = 0 }: { bars: number[]; progress?: number }) {
  return (
    <span className="flex h-6 items-center gap-[2px]" aria-hidden>
      {bars.map((b, i) => (
        <span key={i} className={`w-[3px] rounded-full ${i / bars.length < progress ? "bg-[--color-bg]" : "bg-[--color-bg]/45"}`} style={{ height: `${Math.max(12, b * 100)}%` }} />
      ))}
    </span>
  );
}

export function VisitorVoice({ msg, lang, localUrl, onReAsk }: { msg: Msg; lang: UiLang; localUrl?: string; onReAsk: (text: string) => void }) {
  const a = msg.attachment;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  if (a?.kind !== "audio") return null;
  const toggle = () => {
    if (!localUrl) return;
    audio.current ??= new Audio(localUrl);
    const el = audio.current;
    el.ontimeupdate = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    el.onended = () => {
      setPlaying(false);
      setProgress(0);
    };
    if (playing) {
      el.pause();
      setPlaying(false);
    } else void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const mmss = `${Math.floor(a.durationS / 60)}:${String(a.durationS % 60).padStart(2, "0")}`;
  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggle} disabled={!localUrl} aria-label={playing ? t("pause", lang) : t("play", lang)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[--color-bg]/15 disabled:opacity-50">
          {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
        <Waveform bars={a.waveform} progress={progress} />
        <span className="text-xs tabular-nums">{mmss}</span>
      </div>
      {a.transcript !== undefined &&
        (editing ? (
          <form
            className="mt-2 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) onReAsk(draft.trim());
              setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`edit-${msg.id}`}>{t("edit", lang)}</label>
            <input id={`edit-${msg.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} lang={langAttr(draft)} className="min-h-11 min-w-0 flex-1 rounded bg-[--color-bg] px-2 text-sm text-[--color-text]" autoFocus />
            <button type="submit" className="min-h-11 rounded bg-[--color-bg] px-2 text-xs font-semibold text-[--color-accent]">{t("reAsk", lang)}</button>
          </form>
        ) : (
          <p className="mt-1 text-xs opacity-80" lang={langAttr(a.transcript)}>
            {t("heard", lang)} “{a.transcript || "…"}”{" "}
            <button type="button" onClick={() => { setDraft(a.transcript ?? ""); setEditing(true); }} className="min-h-6 font-semibold underline">
              {t("edit", lang)}
            </button>
          </p>
        ))}
    </div>
  );
}

export function SpeakButton({ state, lang, onClick }: { state: SpeechState | undefined; lang: UiLang; onClick: () => void }) {
  const s = state ?? "idle";
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={s === "playing" ? t("pause", lang) : t("play", lang)}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[--color-border-strong] text-[--color-text-muted] hover:text-[--color-text] ${s === "blocked" ? "border-[--color-accent] text-[--color-accent]" : ""}`}
      >
        {s === "loading" ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : s === "playing" ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
      </button>
      {s === "blocked" && <span className="text-xs text-[--color-accent]">{t("tapToHear", lang)}</span>}
    </span>
  );
}

/* ── handoff card + lead form (phase 4) ───────────────────────────────────── */
export function buildLeadMessage(message: string, thread: Msg[]): string {
  // Visitor's own words first; the appended chat is labelled unverified and capped so the
  // contact route (5,000 chars) never truncates the part that matters (eng R3-7).
  const head = message.trim().slice(0, 3000);
  const ctx = thread
    .slice(-6)
    .map((m) => `${m.role === "visitor" ? "Visitor" : "AI twin"}: ${plainText(m)}`)
    .join("\n");
  const label = "\n\n--- Chat context (visitor-supplied, unverified) ---\n";
  return (head + label + ctx).slice(0, 4990);
}

export function HandoffCard({ lang, thread, question }: { lang: UiLang; thread?: Msg[]; question?: string }) {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<"closed" | "open" | "sending" | "sent" | "error">("closed");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* selection still possible */
    }
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setForm("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          company: f.get("company"), // honeypot
          subject: `[AI Twin lead] ${(question ?? "").slice(0, 60) || "Message from the chat"}`,
          message: buildLeadMessage(String(f.get("message") ?? ""), thread ?? []),
        }),
      });
      setForm(r.ok ? "sent" : "error");
    } catch {
      setForm("error");
    }
  };
  return (
    <div className="mt-2 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-3 text-sm" data-testid="handoff-card">
      <p className="flex items-center gap-2 font-semibold text-[--color-text]">
        <UserRound size={16} aria-hidden /> {t("realMeTitle", lang)}
      </p>
      <ul className="mt-2 space-y-1.5 text-[--color-text-muted]">
        <li>
          <Link href="/#contact" className="text-[--color-accent] underline underline-offset-2">{t("contactForm", lang)}</Link>
        </li>
        <li className="flex items-center gap-2">
          <span className="select-all">{profile.email}</span>
          <button type="button" onClick={copy} className="inline-flex h-11 min-w-11 items-center justify-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text]">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? t("copied", lang) : t("copy", lang)}
          </button>
        </li>
        <li>
          <a href={socials.linkedin.url} target="_blank" rel="noreferrer" className="text-[--color-accent] underline underline-offset-2">LinkedIn</a>
        </li>
      </ul>
      {form === "closed" && (
        <button type="button" onClick={() => setForm("open")} className="mt-2 min-h-11 w-full rounded-[--radius] border border-[--color-border-strong] px-3 text-left text-[--color-text] hover:border-[--color-accent]">
          {t("leadOpen", lang)}
        </button>
      )}
      {(form === "open" || form === "sending" || form === "error") && (
        <form onSubmit={submit} className="mt-2 space-y-2" aria-label={t("leadOpen", lang)}>
          {(["name", "email"] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`lead-${k}`} className="block text-xs text-[--color-text-muted]">{t(k === "name" ? "leadName" : "leadEmail", lang)}</label>
              <input id={`lead-${k}`} name={k} type={k === "email" ? "email" : "text"} required maxLength={k === "email" ? 200 : 120} autoComplete={k} className="min-h-11 w-full rounded border border-[--color-border] bg-[--color-bg] px-2 text-[16px] text-[--color-text]" />
            </div>
          ))}
          <div>
            <label htmlFor="lead-message" className="block text-xs text-[--color-text-muted]">{t("leadMessage", lang)}</label>
            <textarea id="lead-message" name="message" required rows={3} maxLength={3000} className="w-full rounded border border-[--color-border] bg-[--color-bg] px-2 py-2 text-[16px] text-[--color-text]" />
          </div>
          <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          {form === "error" && <p className="text-xs text-[--color-text]">{t("leadError", lang)}</p>}
          <button type="submit" disabled={form === "sending"} className="min-h-11 w-full rounded-[--radius] bg-[--color-accent] font-semibold text-[--color-bg] disabled:opacity-60">
            {form === "sending" ? <Loader2 size={16} className="mx-auto animate-spin motion-reduce:animate-none" aria-hidden /> : t("leadSend", lang)}
          </button>
        </form>
      )}
      {form === "sent" && <p className="mt-2 text-[--color-success]">{t("leadSent", lang)}</p>}
    </div>
  );
}

export function RetryButton({ lang, onClick }: { lang: UiLang; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-[--radius] border border-[--color-border-strong] px-3 text-sm text-[--color-text] hover:border-[--color-accent]">
      <RotateCcw size={14} aria-hidden /> {t("retry", lang)}
    </button>
  );
}
