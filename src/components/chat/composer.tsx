"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent, type RefObject } from "react";
import { ArrowUp, Camera, ImageIcon, Mic, Plus, SendHorizontal, X } from "lucide-react";
import { canRecord, MAX_RECORD_S, prepareImage, VoiceRecorder, waveformOf, blobToBase64 } from "./media";
import { t, type UiLang } from "./strings";
import type { Quote } from "./thread-store";
import type { SendInput } from "./use-twin-chat";
import { langAttr } from "./chat-parts";

/** Phases 2/3 switches. Images and voice ship on by default; set "false" to hide either control. */
const IMAGES_ON = process.env.NEXT_PUBLIC_TWIN_IMAGES !== "false";
const VOICE_ON = process.env.NEXT_PUBLIC_TWIN_VOICE !== "false";

type Props = {
  variant: "panel" | "page";
  lang: UiLang;
  disabled: boolean;
  locked: boolean;
  quote: Quote | null;
  onCancelQuote: () => void;
  onSend: (input: SendInput, localAudioUrl?: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  turnstileEl: RefObject<HTMLDivElement | null>;
  verifying: boolean;
  notice: string | null;
  setNotice: (s: string | null) => void;
};

export function Composer({ variant, lang, disabled, locked, quote, onCancelQuote, onSend, inputRef, turnstileEl, verifying, notice, setNotice }: Props) {
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState(false);
  const [rec, setRec] = useState<{ startedAt: number; dx: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const recorder = useRef<VoiceRecorder | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const startX = useRef(0);
  // Decided after mount: the server can't know about the mic, and a guess here broke hydration.
  const [voiceOk, setVoiceOk] = useState(false);
  useEffect(() => setVoiceOk(VOICE_ON && canRecord()), []);

  useEffect(() => {
    if (!rec) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [rec]);

  useEffect(() => {
    if (rec && now - rec.startedAt >= MAX_RECORD_S * 1000) void finishRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  useEffect(() => () => recorder.current?.cancel(), []);

  const submit = () => {
    if (disabled || !draft.trim()) return;
    onSend({ text: draft, quote: quote ?? undefined });
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && quote) onCancelQuote();
  };

  const onFile = async (file: File | undefined) => {
    setSheet(false);
    if (!file) return;
    try {
      const img = await prepareImage(file);
      onSend({ text: draft, image: img, quote: quote ?? undefined });
      setDraft("");
    } catch {
      setNotice(t("imageBad", lang));
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    setNotice(null);
    recorder.current = new VoiceRecorder(() => {
      recorder.current?.cancel();
      setRec(null);
      setNotice(t("recInterrupted", lang));
    });
    try {
      await recorder.current.start();
      setRec({ startedAt: Date.now(), dx: 0 });
      setNow(Date.now());
    } catch {
      recorder.current = null;
      setNotice(t("micDenied", lang));
    }
  };

  const cancelRecording = () => {
    recorder.current?.cancel();
    recorder.current = null;
    setRec(null);
  };

  const finishRecording = async () => {
    const r = recorder.current;
    recorder.current = null;
    setRec(null);
    const blob = await r?.stop();
    if (!blob || blob.size < 1200) return; // tap without speech
    const { bars, durationS } = await waveformOf(blob);
    const mime = blob.type.split(";")[0] || "audio/webm";
    onSend({ audio: { payload: { mime, data: await blobToBase64(blob) }, durationS, waveform: bars }, quote: quote ?? undefined }, URL.createObjectURL(blob));
  };

  // Slide-to-cancel on touch (design 7B); desktop uses the ✕ button.
  const onPointerDown = (e: RPointerEvent) => (startX.current = e.clientX);
  const onPointerMove = (e: RPointerEvent) => rec && setRec({ ...rec, dx: Math.min(0, e.clientX - startX.current) });
  const onPointerUp = () => rec && rec.dx < -80 && cancelRecording();

  const secs = rec ? Math.floor((now - rec.startedAt) / 1000) : 0;

  return (
    <div className={`bg-[--color-bg-elevated] px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${variant === "page" ? "sm:px-6 sm:pb-5" : ""}`}>
      <div className={variant === "page" ? "mx-auto w-full max-w-[44rem]" : ""}>
      {/* Turnstile renders here only when Cloudflare needs an interactive check (design 2C). */}
      <div ref={turnstileEl} className="empty:hidden mb-2" />
      {verifying && <p className="mb-2 text-xs text-[--color-text-muted]">{t("verifying", lang)}</p>}
      {notice && (
        <p role="status" className="mb-2 flex items-start gap-2 text-xs text-[--color-text]">
          <span className="flex-1">{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)} className="h-6 w-6 text-[--color-text-muted]"><X size={12} aria-hidden /></button>
        </p>
      )}
      {quote && (
        <div className="mb-2 flex items-center gap-2 rounded-[--radius] border-l-2 border-[--color-accent] bg-[--color-surface] px-2 py-1.5 text-xs" data-testid="quote-preview">
          {quote.thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.thumb} alt="" className="h-10 w-10 rounded object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[--color-accent]">{t("replyingTo", lang)} {quote.role === "twin" ? t("name", lang) : t("you", lang)}</p>
            <p className="truncate text-[--color-text-muted]" lang={langAttr(quote.text)}>{quote.text}</p>
          </div>
          <button type="button" onClick={onCancelQuote} aria-label={t("cancelReply", lang)} className="inline-flex h-11 w-11 items-center justify-center text-[--color-text-muted]"><X size={14} aria-hidden /></button>
        </div>
      )}

      {rec ? (
        <div className="flex items-center gap-2" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} data-testid="recording">
          <button type="button" onClick={cancelRecording} aria-label={t("cancelRecording", lang)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[--color-text-muted]"><X size={18} aria-hidden /></button>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden />
          <span className="tabular-nums text-sm text-[--color-text]" aria-live="off">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
          <span className="flex-1 truncate text-center text-xs text-[--color-text-muted] sm:hidden" style={{ transform: `translateX(${rec.dx}px)` }}>{t("slideCancel", lang)}</span>
          <span className="hidden flex-1 sm:block" />
          <button type="button" onClick={() => void finishRecording()} aria-label={t("stopSend", lang)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[--color-accent] text-[--color-bg]"><SendHorizontal size={18} aria-hidden /></button>
        </div>
      ) : (
        <form className="twin-field relative" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {IMAGES_ON && (
            <>
              <button type="button" aria-label={t("attach", lang)} aria-expanded={sheet} disabled={disabled} onClick={() => setSheet((s) => !s)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[--color-text-muted] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-text] disabled:opacity-40">
                <Plus size={20} className={`transition-transform duration-200 ${sheet ? "rotate-45" : ""}`} aria-hidden />
              </button>
              {sheet && (
                <div role="menu" className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-[--radius] border border-[--color-border-strong] bg-[--color-bg-elevated] p-1 text-sm">
                  <button role="menuitem" type="button" onClick={() => galleryRef.current?.click()} className="flex h-11 w-full items-center gap-2 rounded px-2 text-[--color-text] hover:bg-[--color-surface]"><ImageIcon size={16} aria-hidden /> {t("gallery", lang)}</button>
                  <button role="menuitem" type="button" onClick={() => cameraRef.current?.click()} className="flex h-11 w-full items-center gap-2 rounded px-2 text-[--color-text] hover:bg-[--color-surface]"><Camera size={16} aria-hidden /> {t("camera", lang)}</button>
                </div>
              )}
              <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" data-testid="gallery-input" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </>
          )}
          <label htmlFor={`twin-input-${variant}`} className="sr-only">{t("placeholder", lang)}</label>
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
            disabled={locked}
            lang={langAttr(draft)}
            className={`max-h-[140px] min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-[--color-text] outline-none placeholder:text-[--color-text-faint] disabled:opacity-60 ${IMAGES_ON ? "px-1" : "px-3"}`}
          />
          {voiceOk && !draft.trim() ? (
            <button type="button" aria-label={t("record", lang)} disabled={disabled} onClick={() => void startRecording()} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[--color-text-muted] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-text] disabled:opacity-40">
              <Mic size={19} aria-hidden />
            </button>
          ) : (
            <button type="submit" aria-label={t("send", lang)} disabled={disabled || !draft.trim()} className="press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--color-accent] text-[--color-bg] disabled:bg-[--color-surface-2] disabled:text-[--color-text-faint]">
              <ArrowUp size={19} strokeWidth={2.4} aria-hidden />
            </button>
          )}
        </form>
      )}
      </div>
    </div>
  );
}
