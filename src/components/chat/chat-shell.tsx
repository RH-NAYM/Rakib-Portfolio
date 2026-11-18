"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, Loader2, Maximize2, MoreHorizontal, Play, Reply, X } from "lucide-react";
import type { Media } from "@/lib/twin-events";
import {
  Avatar, Citations, HandoffCard, langAttr, Lightbox, MediaGroup, RetryButton, SpeakButton, TraceBody, VisitorVoice,
} from "./chat-parts";
import { Composer } from "./composer";
import { PROMPTS, t, type UiLang } from "./strings";
import { plainText, quoteOf, type LangChoice, type Msg, type Quote } from "./thread-store";
import { useSpeech } from "./use-speech";
import { useTwinChat } from "./use-twin-chat";

const GAP_MS = 5 * 60 * 1000;
const LABEL_KEY = "twin-launcher-seen";
const LOGGING_ON = process.env.NEXT_PUBLIC_TWIN_LOGGING === "true"; // mirror of TWIN_LOG_CONVERSATIONS
const VOICE_ON = process.env.NEXT_PUBLIC_TWIN_VOICE !== "false";
const LANG_CHOICES: LangChoice[] = ["auto", "en", "bn", "banglish"];
const LANG_LABEL: Record<LangChoice, string> = { auto: "Auto", en: "English", bn: "বাংলা", banglish: "Banglish" };

function TimeDivider({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <p className="my-2 text-center text-[11px] text-[--color-text-muted]">
      {d.toLocaleDateString(undefined, { weekday: "short" })} {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </p>
  );
}

function QuoteStrip({ quote, lang, onJump, onDark }: { quote: Quote; lang: UiLang; onJump: () => void; onDark: boolean }) {
  return (
    <button type="button" onClick={onJump} className={`mb-1.5 flex w-full items-center gap-2 rounded-md border-l-2 px-2 py-1 text-left text-xs ${onDark ? "border-[--color-bg] bg-[--color-bg]/15" : "border-[--color-accent] bg-[--color-bg]"}`}>
      {quote.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={quote.thumb} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      )}
      <span className="min-w-0">
        <span className="block font-semibold">{quote.role === "twin" ? t("name", lang) : t("you", lang)}</span>
        <span className="line-clamp-2 opacity-80" lang={langAttr(quote.text)}>{quote.text}</span>
      </span>
    </button>
  );
}

function Chips({ msg, lang }: { msg: Msg; lang: UiLang }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {(msg.steps ?? []).map((s) => (
        <span key={s.step} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-150 ${s.status === "active" ? "border-[--color-border-strong] text-[--color-text]" : "border-[--color-border] text-[--color-text-muted]"}`}>
          {s.status === "active" ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Check size={11} aria-hidden />}
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
  traceOpen: boolean;
  onToggleTrace: () => void;
  drawer: boolean;
};

function TwinBody({ msg, lang, thread, question, onRetry, onOpenMedia, traceOpen, onToggleTrace, drawer }: TwinBodyProps) {
  if (msg.status === "waiting") return <Chips msg={msg} lang={lang} />;
  const notice = (key: Parameters<typeof t>[0], vars?: Record<string, number>) => (
    <p className="text-[--color-text]" lang={lang === "bn" ? "bn" : undefined}>{t(key, lang, vars)}</p>
  );
  if (msg.status === "error") {
    switch (msg.errorKind) {
      case "partial":
        return (
          <>
            <p className="text-[--color-text-muted]" lang={langAttr(msg.text)}><Citations text={msg.text} sources={msg.sources} /></p>
            <p className="mt-2 text-xs text-[--color-text-muted]">{t("partial", lang)}</p>
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
      <p className="whitespace-pre-wrap text-[--color-text]" lang={langAttr(msg.text)}><Citations text={msg.text} sources={msg.sources} /></p>
      {msg.media && msg.media.length > 0 && <MediaGroup media={msg.media} lang={lang} onOpen={(i) => onOpenMedia(msg.media!, i)} />}
      {msg.card === "contact" && <HandoffCard lang={lang} thread={thread} question={question} />}
      {/* Templated replies (greeting, handoff, off-topic) have no plan or sources: nothing to explain. */}
      {msg.status === "done" && msg.trace && (msg.trace.source_count > 0 || msg.trace.plan.length > 0) && (
        <div className="mt-2 border-t border-[--color-border] pt-1.5">
          <button type="button" onClick={onToggleTrace} aria-expanded={traceOpen} className="inline-flex min-h-8 items-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text]">
            {t("howIAnswered", lang)} · {msg.trace.source_count} {t("sources", lang)} · {(msg.trace.elapsed_ms / 1000).toFixed(1)}s
            <ChevronDown size={12} className={traceOpen ? "rotate-180" : ""} aria-hidden />
          </button>
          {traceOpen && !drawer && <div className="mt-2"><TraceBody trace={msg.trace} sources={msg.sources} lang={lang} /></div>}
        </div>
      )}
    </>
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
  const pillText = thread.langChoice === "auto" ? `${t("auto", lang)} · ${LANG_LABEL[lang]}` : LANG_LABEL[thread.langChoice];
  const closeMenus = () => {
    setLangMenu(false);
    if (menu !== "closed") setMenu("closed");
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-[--color-border] bg-[--color-bg-elevated] px-4 py-3">
          <Avatar size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[--color-text]">{t("name", lang)}</p>
            <p className="truncate text-[13px] text-[--color-text-muted]" lang={lang === "bn" ? "bn" : undefined}>{t("status", lang)}</p>
          </div>
          <div className="relative">
            {/* Accessible name = visible text + purpose, so voice-control users can say what they see (axe label-content-name-mismatch). */}
            <button type="button" aria-label={`${pillText}, ${t("language", lang)}`} aria-haspopup="menu" aria-expanded={langMenu} onClick={() => { setLangMenu((v) => !v); setMenu("closed"); }} className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-[--color-border-strong] px-2.5 text-xs text-[--color-text-muted] hover:text-[--color-text]">
              {pillText}
            </button>
            {langMenu && (
              <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-1 text-sm">
                {LANG_CHOICES.map((c) => (
                  <button key={c} role="menuitemradio" aria-checked={thread.langChoice === c} type="button" onClick={() => { chat.setLangChoice(c); setLangMenu(false); }} className="flex h-11 w-full items-center justify-between rounded px-2 text-left text-[--color-text] hover:bg-[--color-surface]" lang={c === "bn" ? "bn" : undefined}>
                    {c === "auto" ? t("auto", lang) : LANG_LABEL[c]} {thread.langChoice === c && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" aria-label={t("newChat", lang)} aria-haspopup="menu" onClick={() => { setMenu(menu === "closed" ? "open" : "closed"); setLangMenu(false); }} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text]">
              <MoreHorizontal size={18} aria-hidden />
            </button>
            {menu !== "closed" && (
              <div role="menu" className="absolute right-0 top-full z-20 w-56 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-2 text-sm">
                {menu === "open" ? (
                  <button role="menuitem" type="button" className="h-11 w-full rounded px-2 text-left text-[--color-text] hover:bg-[--color-surface]" onClick={() => setMenu("confirm")}>{t("newChat", lang)}</button>
                ) : (
                  <div className="p-1">
                    <p className="mb-2 text-[--color-text]">{t("clearConfirm", lang)}</p>
                    <div className="flex gap-2">
                      <button type="button" className="h-11 flex-1 rounded border border-[--color-border-strong] text-[--color-text]" onClick={() => { chat.clear(); setQuote(null); setMenu("closed"); }}>{t("clear", lang)}</button>
                      <button type="button" className="h-11 flex-1 rounded text-[--color-text-muted]" onClick={() => setMenu("closed")}>{t("cancel", lang)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {variant === "panel" && (
            <>
              <Link href="/chat" aria-label={t("expand", lang)} className="hidden h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text] sm:inline-flex"><Maximize2 size={16} aria-hidden /></Link>
              <button type="button" aria-label={t("close", lang)} onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted] hover:text-[--color-text]"><X size={18} aria-hidden /></button>
            </>
          )}
        </div>

        {!thread.disclosureDismissed && (
          <div className="flex items-center gap-2 border-b border-[--color-border] px-4 py-1.5 text-xs text-[--color-text-muted]">
            <p className="flex-1" lang={lang === "bn" ? "bn" : undefined}>
              {t("disclosure", lang)} <Link href="/#contact" className="text-[--color-accent] underline underline-offset-2">{t("contact", lang)}</Link>
              {LOGGING_ON && <> · {t("storedNotice", lang)}</>}
            </p>
            <button type="button" aria-label="Dismiss" onClick={chat.dismissDisclosure} className="inline-flex h-8 w-8 items-center justify-center hover:text-[--color-text]"><X size={12} aria-hidden /></button>
          </div>
        )}

        {/* thread */}
        <div ref={scrollRef} role="log" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto px-4 py-4" onClick={closeMenus}>
          {empty && (
            <div className="deal-in space-y-3">
              <div className="flex items-end gap-2">
                <Avatar size={28} />
                <div className="max-w-[85%] rounded-[18px] rounded-bl-md border border-[--color-border] bg-[--color-surface] px-3.5 py-2.5 text-[16px] leading-relaxed text-[--color-text]" lang={lang === "bn" ? "bn" : undefined}>{t("greeting", lang)}</div>
              </div>
              <div className="flex flex-wrap gap-2 pl-9">
                {PROMPTS[lang].map((p) => (
                  <button key={p} type="button" onClick={() => chat.send({ text: p })} disabled={disabled} className="min-h-11 rounded-full border border-[--color-border-strong] px-3 py-1.5 text-left text-sm text-[--color-text-muted] hover:border-[--color-accent] hover:text-[--color-text] disabled:opacity-50" lang={langAttr(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            {thread.messages.map((m, i) => {
              const prev = thread.messages[i - 1];
              const gap = !prev || m.createdAt - prev.createdAt > GAP_MS;
              const groupStart = !prev || prev.role !== m.role || gap;
              const visitor = m.role === "visitor";
              const actions = actionsFor === m.id && (
                <div role="menu" aria-label={t("messageActions", lang)} className={`mt-1 flex gap-1 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-1 text-sm ${visitor ? "self-end" : ""}`}>
                  <button role="menuitem" type="button" onClick={() => startReply(m)} className="flex h-11 items-center gap-1 rounded px-2 text-[--color-text] hover:bg-[--color-surface]"><Reply size={14} aria-hidden /> {t("reply", lang)}</button>
                  <button role="menuitem" type="button" onClick={() => void copyText(m)} className="flex h-11 items-center gap-1 rounded px-2 text-[--color-text] hover:bg-[--color-surface]"><Copy size={14} aria-hidden /> {t("copy", lang)}</button>
                  {VOICE_ON && !visitor && m.status === "done" && (
                    <button role="menuitem" type="button" onClick={() => { setActionsFor(null); void speech.play(m.id, plainText(m), (m.lang ?? lang) as UiLang); }} className="flex h-11 items-center gap-1 rounded px-2 text-[--color-text] hover:bg-[--color-surface]"><Play size={14} aria-hidden /> {t("play", lang)}</button>
                  )}
                </div>
              );
              const replyBtn = m.status !== "waiting" && (
                <button type="button" aria-label={t("reply", lang)} onClick={() => startReply(m)} className="hidden h-8 w-8 shrink-0 items-center justify-center self-center rounded-full text-[--color-text-muted] opacity-0 hover:text-[--color-text] focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 sm:inline-flex">
                  <Reply size={14} aria-hidden />
                </button>
              );
              return (
                <div key={m.id} className={groupStart && i > 0 ? "pt-2" : ""}>
                  {gap && <TimeDivider at={m.createdAt} />}
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
                    className={`group deal-in flex flex-col rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[--color-accent] ${visitor ? "items-end" : ""}`}
                  >
                    {visitor ? (
                      <>
                        <div className="flex max-w-full items-center gap-1">
                          {replyBtn}
                          <div className="max-w-[85%] whitespace-pre-wrap rounded-[18px] rounded-br-md bg-[--color-accent] px-3.5 py-2.5 text-[16px] leading-relaxed text-[--color-bg]" lang={langAttr(m.text)} data-testid="visitor-bubble">
                            {m.quote && <QuoteStrip quote={m.quote} lang={lang} onDark onJump={() => jumpTo(m.quote!.id)} />}
                            {m.attachment?.kind === "image" && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.attachment.thumb} alt={m.attachment.description ?? ""} className="mb-1.5 max-h-48 rounded-lg" />
                            )}
                            {m.attachment?.kind === "audio" ? (
                              <VisitorVoice msg={m} lang={lang} localUrl={localAudio.current.get(m.id)} onReAsk={(text) => chat.reAsk(text, quoteOf(m))} />
                            ) : (
                              m.text
                            )}
                          </div>
                        </div>
                        <span className="mt-0.5 text-[--color-text-muted]">
                          {m.status === "sending" ? <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Check size={11} aria-hidden />}
                          <span className="sr-only">{m.status === "sending" ? "sending" : "sent"}</span>
                        </span>
                      </>
                    ) : (
                      <div className="flex items-end gap-2">
                        {groupStart ? <Avatar size={28} /> : <span className="w-7 shrink-0" />}
                        <div className="max-w-[85%] rounded-[18px] rounded-bl-md border border-[--color-border] bg-[--color-surface] px-3.5 py-2.5 text-[16px] leading-relaxed" data-testid="twin-bubble">
                          <TwinBody
                            msg={m}
                            lang={lang}
                            thread={thread.messages}
                            question={questionFor(m)}
                            onRetry={chat.retry}
                            onOpenMedia={(media, idx) => setLightbox({ media, i: idx })}
                            traceOpen={traceFor === m.id}
                            onToggleTrace={() => setTraceFor(traceFor === m.id ? null : m.id)}
                            drawer={drawer}
                          />
                        </div>
                        {VOICE_ON && m.status === "done" && m.text && (
                          <SpeakButton state={speech.states[m.id]} lang={lang} onClick={() => void speech.play(m.id, plainText(m), (m.lang ?? lang) as UiLang)} />
                        )}
                        {replyBtn}
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
        <aside aria-label={t("howIAnswered", lang)} className="w-[340px] shrink-0 overflow-y-auto border-l border-[--color-border] bg-[--color-bg-elevated] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[--color-text]">{t("howIAnswered", lang)}</p>
            <button type="button" aria-label={t("close", lang)} onClick={() => setTraceFor(null)} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted]"><X size={16} aria-hidden /></button>
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
          {label && <span className="page-in hidden rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] px-3 py-1.5 text-sm text-[--color-text] sm:block">{t("open", "en")}</span>}
          <button type="button" onClick={toggle} aria-label={t("open", "en")} className="rounded-full ring-2 ring-[--color-accent] ring-offset-2 ring-offset-[--color-bg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[--color-accent]">
            <Avatar size={56} />
          </button>
        </div>
      )}
      {open && (
        <div data-chat-root role="dialog" aria-label={t("name", "en")} className="twin-panel fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[--color-bg-elevated] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100dvh-3rem)] sm:w-[400px] sm:rounded-xl sm:border sm:border-[--color-border-strong]">
          <Conversation variant="panel" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

/* ── /chat full page ──────────────────────────────────────────────────────── */

export function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[680px] flex-col border-x border-[--color-border] bg-[--color-bg-elevated] min-[1100px]:max-w-[1020px]" data-chat-root>
      <Conversation variant="page" />
    </div>
  );
}
