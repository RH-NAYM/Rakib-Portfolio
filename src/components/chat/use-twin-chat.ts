"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSSEParser } from "@/lib/twin-events";
import type { Payload } from "./media";
import {
  emptyThread,
  historyFor,
  loadThread,
  reducer,
  serializeThread,
  STORAGE_KEY,
  type Attachment,
  type LangChoice,
  type Msg,
  type Quote,
  type Thread,
} from "./thread-store";
import { getTurnstileToken, TURNSTILE_SITE_KEY } from "./turnstile";

const BENGALI = /[ঀ-৿]/;
const SESSION_MS = 115 * 60 * 1000; // server cookie lives 2h; refresh a little early
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export type SendInput = {
  text?: string;
  image?: { payload: Payload; thumb: string };
  audio?: { payload: Payload; durationS: number; waveform: number[] };
  quote?: Quote;
};

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

class SessionError extends Error {}

/** Chat state + streaming. The floating panel and /chat share one localStorage thread (design 6A). */
export function useTwinChat() {
  const [thread, dispatch] = useReducer(reducer, undefined, () => emptyThread("en"));
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastVoiceAnswer, setLastVoiceAnswer] = useState<string | null>(null);
  const busy = useRef(false);
  const sessionUntil = useRef(0);
  const turnstileEl = useRef<HTMLDivElement>(null);
  // Media bytes for Retry live in memory only (never persisted, eng R1-10).
  const payloads = useRef(new Map<string, { image?: Payload; audio?: Payload }>());

  useEffect(() => {
    dispatch({ type: "load", thread: loadThread(readStorage(), "en") });
    setLoaded(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && !busy.current) dispatch({ type: "load", thread: loadThread(e.newValue, "en") });
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeThread(thread));
    } catch {
      /* storage full or blocked: chat still works for this tab */
    }
  }, [thread, loaded]);

  const ensureSession = useCallback(async (force = false) => {
    if (!TURNSTILE_SITE_KEY) return; // bot check not configured yet (phase 1b is opt-in)
    if (!force && Date.now() < sessionUntil.current) return;
    const el = turnstileEl.current;
    if (!el) throw new SessionError("no container");
    try {
      const token = await getTurnstileToken(el, () => setVerifying(true));
      const r = await fetch("/api/twin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (!r.ok) throw new SessionError(`session ${r.status}`);
      sessionUntil.current = Date.now() + SESSION_MS;
    } catch (e) {
      throw e instanceof SessionError ? e : new SessionError(String(e));
    } finally {
      setVerifying(false);
    }
  }, []);

  const stream = useCallback(
    async (twinId: string, visitor: Msg, snapshot: Thread) => {
      busy.current = true;
      let finished = false;
      const fromVoice = visitor.attachment?.kind === "audio";
      const parse = createSSEParser((e) => {
        if (e.type === "step") dispatch({ type: "step", twinId, event: e });
        else if (e.type === "meta") dispatch({ type: "meta", twinId, event: e });
        else if (e.type === "token") dispatch({ type: "token", twinId, text: e.text });
        else if (e.type === "final") {
          finished = true;
          dispatch({ type: "final", twinId, event: e });
          if (fromVoice) setLastVoiceAnswer(twinId);
        } else if (e.type === "error") {
          finished = true;
          dispatch({ type: "error", twinId, kind: e.kind, retryAfterS: e.retry_after_s });
        }
      });
      const media = payloads.current.get(visitor.id);
      const body = JSON.stringify({
        message: visitor.attachment?.kind === "audio" ? "" : visitor.text,
        history: historyFor(snapshot, visitor.id),
        reply_to: visitor.quote ? { role: visitor.quote.role === "twin" ? "assistant" : "user", text: visitor.quote.text } : null,
        lang: snapshot.langChoice,
        image: media?.image ?? null,
        audio: media?.audio ?? null,
      });
      const post = () => fetch("/api/twin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      try {
        if (visitor.attachment && !media) {
          // Bytes were discarded (reload/other tab): ask for the attachment again (design 2A).
          finished = true;
          dispatch({ type: "error", twinId, kind: "bad_request" });
          return;
        }
        await ensureSession();
        let res = await post();
        if (res.status === 401) {
          await ensureSession(true); // expired cookie: re-run Turnstile once, then retry once
          res = await post();
        }
        // The twin answers with SSE (incl. typed errors); anything else is a platform failure.
        if (res.status === 400) {
          finished = true;
          dispatch({ type: "error", twinId, kind: "bad_request" });
          return;
        }
        if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("text/event-stream")) throw new Error(`twin ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parse(dec.decode(value, { stream: true }));
        }
      } catch (e) {
        if (e instanceof SessionError) {
          finished = true;
          dispatch({ type: "error", twinId, kind: "verify_failed" });
        }
      } finally {
        if (!finished) dispatch({ type: "error", twinId, kind: navigator.onLine ? "upstream_unavailable" : "offline" });
        busy.current = false;
      }
    },
    [ensureSession],
  );

  const send = useCallback(
    (input: SendInput) => {
      const text = (input.text ?? "").trim().slice(0, 2000);
      if (busy.current || (!text && !input.image && !input.audio)) return;
      let attachment: Attachment | undefined;
      if (input.image) attachment = { kind: "image", thumb: input.image.thumb };
      if (input.audio) attachment = { kind: "audio", durationS: input.audio.durationS, waveform: input.audio.waveform };
      const visitor: Msg = { id: uid(), role: "visitor", text, createdAt: Date.now(), attachment, quote: input.quote };
      if (input.image || input.audio) payloads.current.set(visitor.id, { image: input.image?.payload, audio: input.audio?.payload });
      const twinId = uid();
      if (BENGALI.test(text)) dispatch({ type: "lang", lang: "bn" });
      dispatch({ type: "send", visitor, twinId });
      void stream(twinId, visitor, thread);
    },
    [stream, thread],
  );

  const retry = useCallback(
    (twinId: string) => {
      if (busy.current) return;
      const twin = thread.messages.find((m) => m.id === twinId);
      const visitor = thread.messages.find((m) => m.id === twin?.replyToVisitorId);
      if (!visitor) return;
      dispatch({ type: "retry", twinId });
      void stream(twinId, visitor, thread);
    },
    [stream, thread],
  );

  /** Edit a mis-heard transcript and ask again as a new text turn (design 7B). */
  const reAsk = useCallback((text: string, quote?: Quote) => send({ text, quote }), [send]);

  const setLangChoice = useCallback((choice: LangChoice) => dispatch({ type: "langChoice", choice }), []);
  const clear = useCallback(() => {
    payloads.current.clear();
    dispatch({ type: "clear" });
  }, []);
  const dismissDisclosure = useCallback(() => dispatch({ type: "dismissDisclosure" }), []);

  const pending = thread.messages.some((m) => m.status === "waiting" || m.status === "streaming");
  const lastTwin = [...thread.messages].reverse().find((m) => m.role === "twin");
  const lockedUntil =
    lastTwin?.errorKind === "rate_limited" && lastTwin.retryAfterS ? lastTwin.createdAt + lastTwin.retryAfterS * 1000 : 0;
  const resting = lastTwin?.errorKind === "cap_exceeded";

  return {
    thread, loaded, online, pending, lockedUntil, resting, verifying, turnstileEl, lastVoiceAnswer,
    send, retry, reAsk, clear, dismissDisclosure, setLangChoice,
  };
}
