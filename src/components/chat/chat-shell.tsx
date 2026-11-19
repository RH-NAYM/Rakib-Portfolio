"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, Loader2, Mail, Maximize2, MoreHorizontal, Play, Reply, X } from "lucide-react";
import { profile } from "@/content/site";
import type { Media } from "@/lib/twin-events";
import {
  Avatar, Citations, HandoffCard, langAttr, Lightbox, MediaGroup, RetryButton, SpeakButton, TraceBody, VisitorVoice,
} from "./chat-parts";
import { Composer } from "./composer";
import { PROMPT_TAGS, PROMPTS, t, type UiLang } from "./strings";
import { plainText, quoteOf, type LangChoice, type Msg, type Quote } from "./thread-store";
import { useSpeech } from "./use-speech";
import { useTwinChat } from "./use-twin-chat";

const GAP_MS = 5 * 60 * 1000;
const LABEL_KEY = "twin-launcher-seen";
const LOGGING_ON = process.env.NEXT_PUBLIC_TWIN_LOGGING === "true"; // mirror of TWIN_LOG_CONVERSATIONS
const VOICE_ON = process.env.NEXT_PUBLIC_TWIN_VOICE !== "false";
const LANG_CHOICES: LangChoice[] = ["auto", "en", "bn", "banglish"];
const LANG_LABEL: Record<LangChoice, string> = { auto: "Auto", en: "English", bn: "বাংলা", banglish: "Banglish" };
const LANG_SHORT: Record<UiLang, string> = { en: "EN", bn: "বাং", banglish: "Banglish" };
/** Each pipeline step wears its annotation color (see .twin-step in globals.css). */
const STEP_TONE: Record<string, "plan" | "read" | "check"> = { planning: "plan", reading: "read", checking: "check", rechecking: "check" };

const lenses = (lang: UiLang) => (lang === "bn" ? "bn" : undefined);

function TimeDivider({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <p className="twin-meta my-3 text-center text-xs text-[--color-text-faint]">
      {d.toLocaleDateString(undefined, { weekday: "short" })} {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </p>
  );
}

function QuoteStrip({ quote, lang, onJump }: { quote: Quote; lang: UiLang; onJump: () => void }) {
  return (
    <button type="button" onClick={onJump} className="mb-2 flex w-full items-center gap-2 rounded-md border-l-2 border-[--color-accent] bg-[--color-bg] px-2 py-1.5 text-left text-[13px] leading-snug">
      {quote.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={quote.thumb} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      )}
      <span className="min-w-0">
        <span className="block font-semibold text-[--color-accent]">{quote.role === "twin" ? t("name", lang) : t("you", lang)}</span>
        <span className="line-clamp-2 text-[--color-text-muted]" lang={langAttr(quote.text)}>{quote.text}</span>
      </span>
    </button>
  );
}

/** The twin's working state: plan → read → check as detection tags (the chat's one loud device). */
function Steps({ msg, lang }: { msg: Msg; lang: UiLang }) {
  const steps = msg.steps ?? [];
  return (
    <div className="flex min-h-7 flex-wrap items-center gap-1.5 py-0.5" aria-live="polite">
      {steps.length === 0 && <span className="twin-step" data-state="active" data-tone="plan"><span className="twin-step-swatch" aria-hidden />{t("step_planning", lang)}</span>}
      {steps.map((s) => (
        <span key={s.step} className="twin-step" data-state={s.status} data-tone={STEP_TONE[s.step] ?? "plan"} lang={lenses(lang)}>
          {s.status === "done" ? <Check size={11} strokeWidth={3} aria-hidden /> : <span className="twin-step-swatch" aria-hidden />}
          {t(`step_${s.step}` as const, lang)}
          {s.status === "active" ? "…" : ""}
        </span>
      ))}
    </div>
  );
}

type TwinBodyProps = {
  msg: Msg;
  lang: UiLang;
  thread: Msg[];
  question?: string;
  onRetry: (id: string) => void;
  onOpenMedia: (media: Media[], i: number) => void;
};

function TwinBody({ msg, lang, thread, question, onRetry, onOpenMedia }: TwinBodyProps) {
  if (msg.status === "waiting") return <Steps msg={msg} lang={lang} />;
  const notice = (key: Parameters<typeof t>[0], vars?: Record<string, number>) => (
    <p className="text-[--color-text]" lang={lenses(lang)}>{t(key, lang, vars)}</p>
  );
  if (msg.status === "error") {
    switch (msg.errorKind) {
      case "partial":
        return (
          <>
            <p className="text-[--color-text-muted]" lang={langAttr(msg.text)}><Citations text={msg.text} sources={msg.sources} /></p>
            <p className="mt-2 text-[13px] text-[--color-text-muted]">{t("partial", lang)}</p>
            <RetryButton lang={lang} onClick={() => onRetry(msg.id)} />
          </>
        );
      case "cap_exceeded":
        return (<>{notice("resting")}<HandoffCard lang={lang} thread={thread} question={question} /></>);
      case "rate_limited":
        return notice("rateLimited", { m: Math.max(1, Math.ceil((msg.retryAfterS ?? 60) / 60)) });
      case "bad_request":
        return notice(thread.find((m) => m.id === msg.replyToVisitorId)?.attachment ? "sendImageAgain" : "badRequest");
      case "verify_failed":
        return (<>{notice("verifyFailed")}<HandoffCard lang={lang} thread={thread} question={question} /></>);
      case "offline":
        return (<>{notice("offline")}<RetryButton lang={lang} onClick={() => onRetry(msg.id)} /></>);
      default:
        return (<>{notice("outage")}<HandoffCard lang={lang} thread={thread} question={question} /><RetryButton lang={lang} onClick={() => onRetry(msg.id)} /></>);
    }
  }
  return (
    <>
      <p className="whitespace-pre-wrap" lang={langAttr(msg.text)}><Citations text={msg.text} sources={msg.sources} /></p>
      {msg.media && msg.media.length > 0 && <MediaGroup media={msg.media} lang={lang} onOpen={(i) => onOpenMedia(msg.media!, i)} />}
      {msg.card === "contact" && <HandoffCard lang={lang} thread={thread} question={question} />}
    </>
  );
}

/* ── /chat side panel: who this is, what it knows, how it answers ─────────── */

function Rail({ lang }: { lang: UiLang }) {
  const steps: { key: Parameters<typeof t>[0]; tone: "plan" | "read" | "check" }[] = [
    { key: "railPlan", tone: "plan" },
    { key: "railRead", tone: "read" },
    { key: "railCheck", tone: "check" },
  ];
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-8 overflow-y-auto border-r border-[--color-border] px-7 py-8 min-[1100px]:flex" lang={lenses(lang)}>
      <div>
        <Avatar size={72} />
        <p className="twin-name mt-4 text-[1.75rem] leading-tight text-[--color-text]">{profile.shortName}<span className="text-[--color-text-faint]">, as an AI</span></p>
        <p className="mt-1 text-sm text-[--color-text-muted]">{profile.title}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[--color-text-muted]">{t("railLead", lang)}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-[--color-text]">{t("railHow", lang)}</p>
        <ol className="mt-3 space-y-2.5">
          {steps.map((s) => (
            <li key={s.key} className="flex items-start gap-3 text-sm text-[--color-text-muted]">
              <span className="twin-step mt-px shrink-0" data-state="done" data-tone={s.tone} aria-hidden>{s.tone}</span>
              <span>{t(s.key, lang)}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-sm leading-relaxed text-[--color-text-muted]">{t("railLangs", lang)}</p>
      <div className="mt-auto border-t border-[--color-border] pt-5">
        <p className="text-sm text-[--color-text]">{t("railHuman", lang)}</p>
        <a href={`mailto:${profile.email}`} className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[--color-accent] underline-offset-4 hover:underline">
          <Mail size={15} aria-hidden /> {t("railEmail", lang)}
        </a>
      </div>
    </aside>
  );
}

/* ── the conversation ─────────────────────────────────────────────────────── */

function Conversation({ variant, onClose }: { variant: "panel" | "page"; onClose?: () => void }) {
  const chat = useTwinChat();
  const speech = useSpeech();
  const { thread } = chat;
  const lang = thread.uiLang;
  const [menu, setMenu] = useState<"closed" | "open" | "confirm">("closed");
  const [langMenu, setLangMenu] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [traceFor, setTraceFor] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ media: Media[]; i: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [wide, setWide] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const localAudio = useRef(new Map<string, string>());
  const pendingAudioUrl = useRef<string | null>(null);
  const press = useRef<{ id: string; x: number; y: number; timer: ReturnType<typeof setTimeout> | null; dx: number } | null>(null);
  const autoplayed = useRef<string | null>(null);

  const lastStatus = thread.messages[thread.messages.length - 1]?.status;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.messages.length, lastStatus]);

  useEffect(() => {
    const last = thread.messages[thread.messages.length - 1];
    if (last?.role === "twin" && last.status === "done") setAnnounce(plainText(last));
  }, [thread.messages]);

  // Remember the object URL of a just-recorded clip for the visitor's own playback (not persisted).
  useEffect(() => {
    const url = pendingAudioUrl.current;
    if (!url) return;
    const v = [...thread.messages].reverse().find((m) => m.role === "visitor" && m.attachment?.kind === "audio" && !localAudio.current.has(m.id));
    if (v) {
      localAudio.current.set(v.id, url);
      pendingAudioUrl.current = null;
    }
  }, [thread.messages]);

  // Auto-play the reply when the visitor asked by voice (design 7B); blocked → "Tap ▶ to hear me".
  useEffect(() => {
    const id = chat.lastVoiceAnswer;
    if (!VOICE_ON || !id || autoplayed.current === id) return;
    const m = thread.messages.find((x) => x.id === id);
    if (m?.status === "done" && m.text) {
      autoplayed.current = id;
      void speech.play(id, plainText(m), (m.lang ?? lang) as UiLang, true);
    }
  }, [chat.lastVoiceAnswer, thread.messages, speech, lang]);

  useEffect(() => {
    if (!chat.lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [chat.lockedUntil]);

  useEffect(() => {
    if (variant !== "page") return;
    const mq = window.matchMedia("(min-width: 1100px)");
    const f = () => setWide(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [variant]);

  // Keep the composer above the iOS keyboard (design 6A).
  useEffect(() => {
    if (variant !== "panel" || !window.visualViewport) return;
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
  const disabled = !chat.online || chat.pending || locked || chat.resting || chat.verifying;
  const empty = chat.loaded && thread.messages.length === 0;
  const drawer = variant === "page" && wide;
  const page = variant === "page";
  const column = page ? "mx-auto w-full max-w-[44rem]" : "";

  const startReply = (m: Msg) => {
    setQuote(quoteOf(m));
    setActionsFor(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  };

  const copyText = async (m: Msg) => {
    setActionsFor(null);
    try {
      await navigator.clipboard.writeText(plainText(m));
    } catch {
      /* text stays selectable */
    }
  };

  // Touch: swipe right to reply (24px edge dead-zone vs iOS back-swipe), long-press for the menu (design 6C).
  const onTouchStart = (m: Msg, e: TouchEvent) => {
    const x = e.touches[0].clientX, y = e.touches[0].clientY;
    if (x < 24) return;
    const timer = setTimeout(() => setActionsFor(m.id), 500);
    press.current = { id: m.id, x, y, timer, dx: 0 };
  };
  const onTouchMove = (e: TouchEvent) => {
    const p = press.current;
    if (!p) return;
    const dx = e.touches[0].clientX - p.x, dy = e.touches[0].clientY - p.y;
    if ((Math.abs(dx) > 8 || Math.abs(dy) > 8) && p.timer) clearTimeout(p.timer);
    p.dx = Math.abs(dy) < 30 ? dx : 0;
  };
  const onTouchEnd = (m: Msg) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.timer) clearTimeout(p.timer);
    if (p.dx > 60) startReply(m);
  };

  const onMsgKey = (m: Msg, e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return; // typing inside an edit field
    const list = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-msg]") ?? []);
    const i = list.indexOf(e.currentTarget as HTMLElement);
    if (e.key === "ArrowDown" && list[i + 1]) {
      e.preventDefault();
      list[i + 1].focus();
    }
    if (e.key === "ArrowUp" && list[i - 1]) {
      e.preventDefault();
      list[i - 1].focus();
    }
    if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && m.status !== "waiting") {
      e.preventDefault();
      startReply(m);
    }
    if (e.key === "Escape") setActionsFor(null);
  };

  const questionFor = (m: Msg) => thread.messages.find((x) => x.id === m.replyToVisitorId)?.text;
  const traceMsg = drawer && traceFor ? thread.messages.find((m) => m.id === traceFor) : undefined;
  const pillText = thread.langChoice === "auto" ? `${t("auto", lang)} · ${LANG_SHORT[lang]}` : LANG_LABEL[thread.langChoice];
  const closeMenus = () => {
    setLangMenu(false);
    if (menu !== "closed") setMenu("closed");
  };
  const iconBtn = "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[--color-text-muted] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-text]";
  const menuItem = "flex h-11 w-full items-center justify-between gap-2 rounded px-2.5 text-left text-[--color-text] hover:bg-[--color-surface-2]";

  return (
    <div className="flex h-full min-h-0">
      {page && <Rail lang={lang} />}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* header */}
        <div className={`flex items-center gap-2.5 border-b border-[--color-border] bg-[--color-bg-elevated] py-2.5 pl-4 pr-2 ${page ? "sm:pl-6 sm:pr-4" : ""}`}>
          <span className={drawer ? "min-[1100px]:hidden" : ""}><Avatar size={36} /></span>
          <div className="min-w-0 flex-1">
            <p className="twin-name truncate text-[15px] leading-5 text-[--color-text]">{t("name", lang)}</p>
            <p className="truncate text-[13px] leading-5 text-[--color-text-muted]" lang={lenses(lang)}>{t("status", lang)}</p>
          </div>
          <div className="relative">
            {/* Accessible name = visible text + purpose, so voice-control users can say what they see (axe label-content-name-mismatch). */}
            <button type="button" aria-label={`${pillText}, ${t("language", lang)}`} aria-haspopup="menu" aria-expanded={langMenu} onClick={() => { setLangMenu((v) => !v); setMenu("closed"); }} className={`twin-meta inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border border-[--color-border-strong] px-2.5 text-xs text-[--color-text-muted] transition-colors hover:border-[--color-text-faint] hover:text-[--color-text] ${page ? "sm:pr-2" : ""}`}>
              {thread.langChoice === "auto" ? (
                <>
                  <span className={page ? "hidden sm:inline" : "hidden"}>{t("auto", lang)} · </span>
                  {LANG_SHORT[lang]}
                </>
              ) : (
                LANG_LABEL[thread.langChoice]
              )}
              <ChevronDown size={12} className={`hidden transition-transform ${page ? "sm:block" : ""} ${langMenu ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {langMenu && (
              <div role="menu" className="page-in absolute right-0 top-full z-20 mt-1.5 w-44 rounded-[--radius] border border-[--color-border-strong] bg-[--color-surface] p-1 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                {LANG_CHOICES.map((c) => (
                  <button key={c} role="menuitemradio" aria-checked={thread.langChoice === c} type="button" onClick={() => { chat.setLangChoice(c); setLangMenu(false); }} className={menuItem} lang={c === "bn" ? "bn" : undefined}>
                    {c === "auto" ? t("auto", lang) : LANG_LABEL[c]} {thread.langChoice === c && <Check size={14} className="text-[--color-accent]" aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" aria-label={t("newChat", lang)} aria-haspopup="menu" onClick={() => { setMenu(menu === "closed" ? "open" : "closed"); setLangMenu(false); }} className={iconBtn}>
              <MoreHorizontal size={18} aria-hidden />
            </button>
            {menu !== "closed" && (
              <div role="menu" className="page-in absolute right-0 top-full z-20 mt-1.5 w-60 rounded-[--radius] border border-[--color-border-strong] bg-[--color-surface] p-1 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                {menu === "open" ? (
                  <button role="menuitem" type="button" className={menuItem} onClick={() => setMenu("confirm")}>{t("newChat", lang)}</button>
                ) : (
                  <div className="p-2">
                    <p className="mb-2.5 text-[--color-text]" lang={lenses(lang)}>{t("clearConfirm", lang)}</p>
                    <div className="flex gap-2">
                      <button type="button" className="h-10 flex-1 rounded bg-[--color-text] font-medium text-[--color-bg]" onClick={() => { chat.clear(); setQuote(null); setMenu("closed"); }}>{t("clear", lang)}</button>
                      <button type="button" className="h-10 flex-1 rounded border border-[--color-border-strong] text-[--color-text-muted] hover:text-[--color-text]" onClick={() => setMenu("closed")}>{t("cancel", lang)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {variant === "panel" && (
            <>
              <Link href="/chat" aria-label={t("expand", lang)} className={`${iconBtn.replace("inline-flex ", "")} hidden sm:inline-flex`}><Maximize2 size={16} aria-hidden /></Link>
              <button type="button" aria-label={t("close", lang)} onClick={onClose} className={iconBtn}><X size={19} aria-hidden /></button>
            </>
          )}
        </div>

        {!thread.disclosureDismissed && (
          <div className="flex items-center gap-2 border-b border-[--color-border] bg-[--color-bg] px-4 py-1 text-xs leading-snug text-[--color-text-muted]">
            <p className={`flex-1 ${page ? "sm:px-2" : ""}`} lang={lenses(lang)}>
              {t("disclosure", lang)} <Link href="/#contact" className="text-[--color-accent] underline underline-offset-2">{t("contact", lang)}</Link>
              {LOGGING_ON && <> · {t("storedNotice", lang)}</>}
            </p>
            <button type="button" aria-label="Dismiss" onClick={chat.dismissDisclosure} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:text-[--color-text]"><X size={13} aria-hidden /></button>
          </div>
        )}

        {/* thread */}
        <div ref={scrollRef} role="log" aria-label="Conversation" className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 ${page ? "sm:px-6 sm:py-8" : ""}`} onClick={closeMenus}>
          {empty && (
            <div className={`deal-in ${column} ${page ? "sm:pt-[10vh]" : ""}`}>
              <div className="flex items-start gap-3">
                <Avatar size={32} />
                <p className="twin-answer pt-1" lang={lenses(lang)}>{t("greeting", lang)}</p>
              </div>
              <div className="mt-5 grid gap-2 sm:pl-11">
                {PROMPTS[lang].map((p, i) => (
                  <button key={p} type="button" onClick={() => chat.send({ text: p })} disabled={disabled} className="twin-prompt" lang={langAttr(p)}>
                    <span className="flex-1">{p}</span>
                    <span className="twin-step shrink-0" data-state="done" style={{ "--tone": PROMPT_TAGS[i].color } as CSSProperties} aria-hidden>{t(PROMPT_TAGS[i].key, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={column}>
            {thread.messages.map((m, i) => {
              const prev = thread.messages[i - 1];
              const gap = !prev || m.createdAt - prev.createdAt > GAP_MS;
              const groupStart = !prev || prev.role !== m.role || gap;
              const visitor = m.role === "visitor";
              const done = m.status === "done";
              const actions = actionsFor === m.id && (
                <div role="menu" aria-label={t("messageActions", lang)} className={`page-in mt-1.5 flex gap-1 rounded-[--radius] border border-[--color-border-strong] bg-[--color-surface] p-1 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] ${visitor ? "self-end" : "ml-11 self-start"}`}>
                  <button role="menuitem" type="button" onClick={() => startReply(m)} className="flex h-11 items-center gap-1.5 rounded px-2.5 text-[--color-text] hover:bg-[--color-surface-2]"><Reply size={14} aria-hidden /> {t("reply", lang)}</button>
                  <button role="menuitem" type="button" onClick={() => void copyText(m)} className="flex h-11 items-center gap-1.5 rounded px-2.5 text-[--color-text] hover:bg-[--color-surface-2]"><Copy size={14} aria-hidden /> {t("copy", lang)}</button>
                  {VOICE_ON && !visitor && done && (
                    <button role="menuitem" type="button" onClick={() => { setActionsFor(null); void speech.play(m.id, plainText(m), (m.lang ?? lang) as UiLang); }} className="flex h-11 items-center gap-1.5 rounded px-2.5 text-[--color-text] hover:bg-[--color-surface-2]"><Play size={14} aria-hidden /> {t("play", lang)}</button>
                  )}
                </div>
              );
              const replyBtn = (extra = "") => m.status !== "waiting" && (
                <button type="button" aria-label={t("reply", lang)} onClick={() => startReply(m)} className={`inline-flex min-h-8 items-center gap-1.5 rounded px-1.5 text-xs text-[--color-text-muted] hover:text-[--color-text] ${extra}`}>
                  <Reply size={13} aria-hidden /><span aria-hidden className={visitor ? "sr-only" : "hidden sm:inline"}>{t("reply", lang)}</span>
                </button>
              );
              const hasTrace = done && m.trace && (m.trace.source_count > 0 || m.trace.plan.length > 0);
              const footer: ReactNode[] = [];
              if (!visitor && hasTrace) {
                footer.push(
                  <button key="trace" type="button" onClick={() => setTraceFor(traceFor === m.id ? null : m.id)} aria-expanded={traceFor === m.id} className="twin-meta inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-xs text-[--color-text-muted] hover:text-[--color-text]">
                    {t("howIAnswered", lang)} · {m.trace!.source_count} {t("sources", lang)} · {(m.trace!.elapsed_ms / 1000).toFixed(1)}s
                    <ChevronDown size={12} className={`transition-transform ${traceFor === m.id ? "rotate-180" : ""}`} aria-hidden />
                  </button>,
                );
              }
              if (!visitor && VOICE_ON && done && m.text) {
                footer.push(<SpeakButton key="speak" state={speech.states[m.id]} lang={lang} onClick={() => void speech.play(m.id, plainText(m), (m.lang ?? lang) as UiLang)} />);
              }
              return (
                <div key={m.id} className={i === 0 ? "" : groupStart ? "pt-6" : "pt-2"}>
                  {gap && i > 0 && <TimeDivider at={m.createdAt} />}
                  <div
                    id={`msg-${m.id}`}
                    data-msg
                    tabIndex={0}
                    aria-label={`${visitor ? t("you", lang) : t("name", lang)}: ${plainText(m).slice(0, 140)}`}
                    onKeyDown={(e) => onMsgKey(m, e)}
                    onTouchStart={(e) => onTouchStart(m, e)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(m)}
                    onContextMenu={(e) => { e.preventDefault(); setActionsFor(m.id); }}
                    className={`group deal-in flex flex-col rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[--color-accent] focus-visible:ring-offset-4 focus-visible:ring-offset-[--color-bg-elevated] ${visitor ? "items-end" : ""}`}
                  >
                    {visitor ? (
                      <div className="flex w-full items-center justify-end gap-1">
                        <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:inline-flex">{replyBtn()}</span>
                        <div className="visitor-bubble" lang={langAttr(m.text)} data-testid="visitor-bubble">
                          {m.quote && <QuoteStrip quote={m.quote} lang={lang} onJump={() => jumpTo(m.quote!.id)} />}
                          {m.attachment?.kind === "image" && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.attachment.thumb} alt={m.attachment.description ?? ""} className="mb-2 max-h-56 rounded-xl" />
                          )}
                          {m.attachment?.kind === "audio" ? (
                            <VisitorVoice msg={m} lang={lang} localUrl={localAudio.current.get(m.id)} onReAsk={(text) => chat.reAsk(text, quoteOf(m))} />
                          ) : (
                            m.text
                          )}
                        </div>
                        <span className="self-end pb-1 text-[--color-text-faint]">
                          {m.status === "sending" ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Check size={11} aria-hidden />}
                          <span className="sr-only">{m.status === "sending" ? "sending" : "sent"}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        {groupStart ? <Avatar size={32} /> : <span className="w-8 shrink-0" />}
                        <div className="min-w-0 flex-1 pt-1" data-testid="twin-bubble">
                          <div className="twin-answer">
                            <TwinBody
                              msg={m}
                              lang={lang}
                              thread={thread.messages}
                              question={questionFor(m)}
                              onRetry={chat.retry}
                              onOpenMedia={(media, idx) => setLightbox({ media, i: idx })}
                            />
                          </div>
                          {m.status !== "waiting" && (
                            <div className="-ml-1.5 mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0">
                              {footer}
                              {replyBtn("sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100")}
                            </div>
                          )}
                          {traceFor === m.id && !drawer && m.trace && (
                            <div className="page-in mt-2 max-w-[62ch] rounded-[--radius] border border-[--color-border] bg-[--color-bg] p-3.5">
                              <TraceBody trace={m.trace} sources={m.sources} lang={lang} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {actions}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>

        <Composer
          variant={variant}
          lang={lang}
          disabled={disabled}
          locked={locked || !!chat.resting}
          quote={quote}
          onCancelQuote={() => setQuote(null)}
          onSend={(input, url) => {
            if (url) pendingAudioUrl.current = url;
            chat.send(input);
            setQuote(null);
          }}
          inputRef={inputRef}
          turnstileEl={chat.turnstileEl}
          verifying={chat.verifying}
          notice={notice ?? (!chat.online ? t("offline", lang) : null)}
          setNotice={setNotice}
        />
      </div>

      {drawer && traceMsg?.trace && (
        <aside aria-label={t("howIAnswered", lang)} className="page-in w-[320px] shrink-0 overflow-y-auto border-l border-[--color-border] bg-[--color-bg] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[--color-text]">{t("howIAnswered", lang)}</p>
            <button type="button" aria-label={t("close", lang)} onClick={() => setTraceFor(null)} className={iconBtn}><X size={16} aria-hidden /></button>
          </div>
          <TraceBody trace={traceMsg.trace} sources={traceMsg.sources} lang={lang} />
        </aside>
      )}

      {lightbox && <Lightbox media={lightbox.media} start={lightbox.i} lang={lang} onClose={() => setLightbox(null)} />}
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
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('[aria-modal="true"]')) setOpen(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      {!open && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 flex items-center gap-3">
          {label && <span className="page-in hidden rounded-full border border-[--color-border-strong] bg-[--color-surface] px-3.5 py-1.5 text-sm text-[--color-text] shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:block">{t("open", "en")}</span>}
          <button type="button" onClick={toggle} aria-label={t("open", "en")} className="press rounded-full ring-2 ring-[--color-accent] ring-offset-2 ring-offset-[--color-bg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[--color-accent]">
            <Avatar size={56} />
          </button>
        </div>
      )}
      {open && (
        <div data-chat-root role="dialog" aria-label={t("name", "en")} className="twin-panel fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[--color-bg-elevated] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[680px] sm:max-h-[calc(100dvh-3rem)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-[--color-border-strong] sm:shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
          <Conversation variant="panel" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

/* ── /chat full page ──────────────────────────────────────────────────────── */

export function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1280px] flex-col bg-[--color-bg-elevated] sm:border-x sm:border-[--color-border]" data-chat-root>
      <Conversation variant="page" />
    </div>
  );
}
