"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Loader2, Maximize2, MoreHorizontal, RotateCcw, SendHorizontal, UserRound, X } from "lucide-react";
import { profile, socials } from "@/content/site";
import { splitCitations, type Source } from "@/lib/twin-events";
import { PROMPTS, t, type UiLang } from "./strings";
import type { Msg } from "./thread-store";
import { useTwinChat } from "./use-twin-chat";

const AVATAR = "/profile-photos/photo-1.jpg"; // replace with /twin-avatar.webp (design 7A crop) when generated
const BENGALI = /[ঀ-৿]/;
const GAP_MS = 5 * 60 * 1000;
const LABEL_KEY = "twin-launcher-seen";

/* ── small pieces ─────────────────────────────────────────────────────────── */

function Avatar({ size }: { size: 28 | 36 | 56 }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <Image src={AVATAR} alt="" width={size} height={size} className="h-full w-full rounded-full object-cover" />
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-1 rounded-[4px] bg-[--color-bg] px-[3px] text-[9px] font-bold leading-[12px] text-[--color-accent] ring-1 ring-[--color-accent-soft]"
      >
        AI
      </span>
    </span>
  );
}

function langAttr(text: string): "bn" | undefined {
  return BENGALI.test(text) ? "bn" : undefined;
}

function Citations({ text, sources }: { text: string; sources?: Source[] }) {
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
              aria-label={src(p.cite)?.title ?? `Source ${p.cite}`}
              aria-expanded={open === p.cite}
              onClick={() => setOpen(open === p.cite ? null : p.cite)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
            >
              {p.cite}
            </button>
            {open === p.cite && src(p.cite) && (
              <span
                role="dialog"
                className="absolute bottom-full left-0 z-10 mb-1 block w-56 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-2 text-xs"
              >
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

function HandoffCard({ lang }: { lang: UiLang }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* selection still possible */
    }
  };
  return (
    <div className="mt-2 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-3 text-sm" data-testid="handoff-card">
      <p className="flex items-center gap-2 font-semibold text-[--color-text]">
        <UserRound size={16} aria-hidden /> {t("realMeTitle", lang)}
      </p>
      <ul className="mt-2 space-y-1.5 text-[--color-text-muted]">
        <li>
          <Link href="/#contact" className="text-[--color-accent] underline underline-offset-2">
            {t("contactForm", lang)}
          </Link>
        </li>
        <li className="flex items-center gap-2">
          <span className="select-all">{profile.email}</span>
          <button type="button" onClick={copy} className="inline-flex h-11 min-w-11 items-center justify-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text]">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? t("copied", lang) : t("copy", lang)}
          </button>
        </li>
        <li>
          <a href={socials.linkedin.url} target="_blank" rel="noreferrer" className="text-[--color-accent] underline underline-offset-2">
            LinkedIn
          </a>
        </li>
      </ul>
    </div>
  );
}

function Chips({ msg, lang }: { msg: Msg; lang: UiLang }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {(msg.steps ?? []).map((s) => (
        <span
          key={s.step}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-150 ${
            s.status === "active" ? "border-[--color-border-strong] text-[--color-text]" : "border-[--color-border] text-[--color-text-muted]"
          }`}
        >
          {s.status === "active" ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Check size={11} aria-hidden />}
          {t(`step_${s.step}` as const, lang)}
          {s.status === "active" ? "…" : ""}
        </span>
      ))}
    </div>
  );
}

function TwinBody({ msg, lang, onRetry }: { msg: Msg; lang: UiLang; onRetry: (id: string) => void }) {
  if (msg.status === "waiting") return <Chips msg={msg} lang={lang} />;
  const notice = (key: Parameters<typeof t>[0], vars?: Record<string, number>) => (
    <p className="text-[--color-text]" lang={lang === "bn" ? "bn" : undefined}>
      {t(key, lang, vars)}
    </p>
  );
  if (msg.status === "error") {
    const retryBtn = (
      <button
        type="button"
        onClick={() => onRetry(msg.id)}
        className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-[--radius] border border-[--color-border-strong] px-3 text-sm text-[--color-text] hover:border-[--color-accent]"
      >
        <RotateCcw size={14} aria-hidden /> {t("retry", lang)}
      </button>
    );
    switch (msg.errorKind) {
      case "partial":
        return (
          <>
            <p className="text-[--color-text-muted]" lang={langAttr(msg.text)}>
              <Citations text={msg.text} sources={msg.sources} />
            </p>
            <p className="mt-2 text-xs text-[--color-text-muted]">{t("partial", lang)}</p>
            {retryBtn}
          </>
        );
      case "cap_exceeded":
        return (
          <>
            {notice("resting")}
            <HandoffCard lang={lang} />
          </>
        );
      case "rate_limited":
        return notice("rateLimited", { m: Math.max(1, Math.ceil((msg.retryAfterS ?? 60) / 60)) });
      case "bad_request":
        return notice("badRequest");
      case "offline":
        return (
          <>
            {notice("offline")}
            {retryBtn}
          </>
        );
      default:
        return (
          <>
            {notice("outage")}
            <HandoffCard lang={lang} />
            {retryBtn}
          </>
        );
    }
  }
  return (
    <>
      <p className="whitespace-pre-wrap text-[--color-text]" lang={langAttr(msg.text)}>
        <Citations text={msg.text} sources={msg.sources} />
      </p>
      {msg.media && msg.media.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {msg.media.slice(0, 4).map((m) => (
            <a key={m.id} href={m.project_url || m.src} className="block overflow-hidden rounded-xl border border-[--color-border]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt ?? m.caption} className="aspect-video w-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {msg.card === "contact" && <HandoffCard lang={lang} />}
      {msg.status === "done" && msg.trace && (
        <p className="mt-2 border-t border-[--color-border] pt-1.5 text-xs text-[--color-text-muted]">
          {t("howIAnswered", lang)} · {msg.trace.source_count} {t("sources", lang)} · {(msg.trace.elapsed_ms / 1000).toFixed(1)}s
        </p>
      )}
    </>
  );
}

function TimeDivider({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <p className="my-2 text-center text-[11px] text-[--color-text-muted]">
      {d.toLocaleDateString(undefined, { weekday: "short" })} {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </p>
  );
}

/* ── the conversation ─────────────────────────────────────────────────────── */

function Conversation({ variant, onClose }: { variant: "panel" | "page"; onClose?: () => void }) {
  const chat = useTwinChat();
  const { thread } = chat;
  const lang = thread.uiLang;
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<"closed" | "open" | "confirm">("closed");
  const [announce, setAnnounce] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.messages]);

  useEffect(() => {
    const last = thread.messages[thread.messages.length - 1];
    if (last?.role === "twin" && last.status === "done") setAnnounce(last.text.replace(/\[\[\d+\]\]/g, ""));
  }, [thread.messages]);

  useEffect(() => {
    if (!chat.lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [chat.lockedUntil]);

  // Keep the composer above the iOS keyboard (design 6A).
  useEffect(() => {
    if (variant !== "panel" || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const el = scrollRef.current?.closest("[data-chat-root]") as HTMLElement | null;
    const fit = () => {
      if (el && window.innerWidth < 640) el.style.height = `${vv.height}px`;
    };
    vv.addEventListener("resize", fit);
    fit();
    return () => vv.removeEventListener("resize", fit);
  }, [variant]);

  const locked = chat.lockedUntil > now;
  const disabled = !chat.online || chat.pending || locked || chat.resting;

  const submit = (text = draft) => {
    if (disabled || !text.trim()) return;
    chat.send(text);
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const empty = chat.loaded && thread.messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-[--color-border] bg-[--color-bg-elevated] px-4 py-3">
        <Avatar size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[--color-text]">{t("name", lang)}</p>
          <p className="truncate text-[13px] text-[--color-text-muted]" lang={lang === "bn" ? "bn" : undefined}>
            {t("status", lang)}
          </p>
        </div>
        <div className="relative">
          <button type="button" aria-label={t("newChat", lang)} aria-haspopup="menu" onClick={() => setMenu(menu === "closed" ? "open" : "closed")} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text]">
            <MoreHorizontal size={18} aria-hidden />
          </button>
          {menu !== "closed" && (
            <div role="menu" className="absolute right-0 top-full z-20 w-56 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-2 text-sm">
              {menu === "open" ? (
                <button role="menuitem" type="button" className="h-11 w-full rounded px-2 text-left text-[--color-text] hover:bg-[--color-surface]" onClick={() => setMenu("confirm")}>
                  {t("newChat", lang)}
                </button>
              ) : (
                <div className="p-1">
                  <p className="mb-2 text-[--color-text]">{t("clearConfirm", lang)}</p>
                  <div className="flex gap-2">
                    <button type="button" className="h-11 flex-1 rounded border border-[--color-border-strong] text-[--color-text]" onClick={() => { chat.clear(); setMenu("closed"); }}>
                      {t("clear", lang)}
                    </button>
                    <button type="button" className="h-11 flex-1 rounded text-[--color-text-muted]" onClick={() => setMenu("closed")}>
                      {t("cancel", lang)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {variant === "panel" && (
          <>
            <Link href="/chat" aria-label={t("expand", lang)} className="hidden h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text] sm:inline-flex">
              <Maximize2 size={16} aria-hidden />
            </Link>
            <button type="button" aria-label={t("close", lang)} onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text]">
              <X size={18} aria-hidden />
            </button>
          </>
        )}
      </div>

      {!thread.disclosureDismissed && (
        <div className="flex items-center gap-2 border-b border-[--color-border] px-4 py-1.5 text-xs text-[--color-text-muted]">
          <p className="flex-1" lang={lang === "bn" ? "bn" : undefined}>
            {t("disclosure", lang)}{" "}
            <Link href="/#contact" className="text-[--color-accent] underline underline-offset-2">
              {t("contact", lang)}
            </Link>
          </p>
          <button type="button" aria-label="Dismiss" onClick={chat.dismissDisclosure} className="inline-flex h-8 w-8 items-center justify-center hover:text-[--color-text]">
            <X size={12} aria-hidden />
          </button>
        </div>
      )}

      {/* thread */}
      <div ref={scrollRef} role="log" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {empty && (
          <div className="deal-in space-y-3">
            <div className="flex items-end gap-2">
              <Avatar size={28} />
              <div className="max-w-[85%] rounded-[18px] rounded-bl-md border border-[--color-border] bg-[--color-surface] px-3.5 py-2.5 text-[16px] leading-relaxed text-[--color-text]" lang={lang === "bn" ? "bn" : undefined}>
                {t("greeting", lang)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-9">
              {PROMPTS[lang].map((p) => (
                <button key={p} type="button" onClick={() => submit(p)} disabled={disabled} className="min-h-11 rounded-full border border-[--color-border-strong] px-3 py-1.5 text-left text-sm text-[--color-text-muted] hover:border-[--color-accent] hover:text-[--color-text] disabled:opacity-50" lang={langAttr(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {thread.messages.map((m, i) => {
            const prev = thread.messages[i - 1];
            const gap = !prev || m.createdAt - prev.createdAt > GAP_MS;
            const groupStart = !prev || prev.role !== m.role || gap;
            return (
              <div key={m.id} className={groupStart && i > 0 ? "pt-2" : ""}>
                {gap && <TimeDivider at={m.createdAt} />}
                {m.role === "visitor" ? (
                  <div className="deal-in flex flex-col items-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-md bg-[--color-accent] px-3.5 py-2.5 text-[16px] leading-relaxed text-[--color-bg]" lang={langAttr(m.text)}>
                      {m.text}
                    </div>
                    <span className="mt-0.5 text-[--color-text-muted]">
                      {m.status === "sending" ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Check size={11} aria-hidden />}
                      <span className="sr-only">{m.status === "sending" ? "sending" : "sent"}</span>
                    </span>
                  </div>
                ) : (
                  <div className="deal-in flex items-end gap-2">
                    {groupStart ? <Avatar size={28} /> : <span className="w-7 shrink-0" />}
                    <div className="max-w-[85%] rounded-[18px] rounded-bl-md border border-[--color-border] bg-[--color-surface] px-3.5 py-2.5 text-[16px] leading-relaxed" data-testid="twin-bubble">
                      <TwinBody msg={m} lang={lang} onRetry={chat.retry} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      {/* composer */}
      <div className="border-t border-[--color-border] bg-[--color-bg-elevated] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {!chat.online && <p className="mb-2 text-xs text-[--color-text-muted]">{t("offline", lang)}</p>}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor={`twin-input-${variant}`} className="sr-only">
            {t("placeholder", lang)}
          </label>
          <textarea
            id={`twin-input-${variant}`}
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={2000}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24 + 20)}px`;
            }}
            onKeyDown={onKey}
            placeholder={t("placeholder", lang)}
            disabled={locked || chat.resting}
            lang={langAttr(draft)}
            className="max-h-[140px] min-h-11 flex-1 resize-none rounded-[--radius] border border-[--color-border] bg-[--color-bg] px-3 py-2.5 text-[16px] text-[--color-text] outline-none placeholder:text-[--color-text-faint] focus:border-[--color-accent] disabled:opacity-60"
          />
          <button type="submit" aria-label={t("send", lang)} disabled={disabled || !draft.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[--color-accent] text-[--color-bg] disabled:opacity-40">
            <SendHorizontal size={18} aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── floating launcher + panel (every page) ───────────────────────────────── */

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(LABEL_KEY) === "1";
    } catch {}
    if (!seen && window.innerWidth >= 640) {
      setLabel(true);
      const id = setTimeout(() => setLabel(false), 6000);
      return () => clearTimeout(id);
    }
  }, []);

  const toggle = () => {
    setOpen((o) => !o);
    setLabel(false);
    try {
      localStorage.setItem(LABEL_KEY, "1");
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      {!open && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 flex items-center gap-3">
          {label && (
            <span className="page-in hidden rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] px-3 py-1.5 text-sm text-[--color-text] sm:block">
              {t("open", "en")}
            </span>
          )}
          <button type="button" onClick={toggle} aria-label={t("open", "en")} className="rounded-full ring-2 ring-[--color-accent] ring-offset-2 ring-offset-[--color-bg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[--color-accent]">
            <Avatar size={56} />
          </button>
        </div>
      )}
      {open && (
        <div
          data-chat-root
          role="dialog"
          aria-label={t("name", "en")}
          className="twin-panel fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[--color-bg-elevated] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100dvh-3rem)] sm:w-[400px] sm:rounded-xl sm:border sm:border-[--color-border-strong]"
        >
          <Conversation variant="panel" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

/* ── /chat full page ──────────────────────────────────────────────────────── */

export function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[680px] flex-col border-x border-[--color-border] bg-[--color-bg-elevated]" data-chat-root>
      <Conversation variant="page" />
    </div>
  );
}
