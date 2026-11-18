"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSSEParser } from "@/lib/twin-events";
import type { UiLang } from "./strings";
import { emptyThread, historyFor, loadThread, reducer, serializeThread, STORAGE_KEY, type Msg, type Thread } from "./thread-store";

const BENGALI = /[ঀ-৿]/;
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Chat state + streaming. The floating panel and /chat share one localStorage thread (design 6A). */
export function useTwinChat() {
  const [thread, dispatch] = useReducer(reducer, undefined, () => emptyThread("en"));
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const busy = useRef(false);

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

  const stream = useCallback(async (twinId: string, message: string, snapshot: Thread) => {
    busy.current = true;
    let finished = false;
    const parse = createSSEParser((e) => {
      if (e.type === "step") dispatch({ type: "step", twinId, event: e });
      else if (e.type === "meta") dispatch({ type: "lang", lang: e.lang as UiLang });
      else if (e.type === "token") dispatch({ type: "token", twinId, text: e.text });
      else if (e.type === "final") {
        finished = true;
        dispatch({ type: "final", twinId, event: e });
      } else if (e.type === "error") {
        finished = true;
        dispatch({ type: "error", twinId, kind: e.kind, retryAfterS: e.retry_after_s });
      }
    });
    try {
      const res = await fetch("/api/twin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: historyFor(snapshot, twinId), reply_to: null, lang: "auto" }),
      });
      // The twin function answers with SSE (incl. typed errors); anything else is a platform
      // failure (crash, 5xx, timeout page) and becomes the outage state (eng D3).
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
    } catch {
      /* handled below */
    } finally {
      if (!finished) dispatch({ type: "error", twinId, kind: navigator.onLine ? "upstream_unavailable" : "offline" });
      busy.current = false;
    }
  }, []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, 2000);
      if (!text || busy.current) return;
      const visitor: Msg = { id: uid(), role: "visitor", text, createdAt: Date.now() };
      const twinId = uid();
      if (BENGALI.test(text)) dispatch({ type: "lang", lang: "bn" });
      dispatch({ type: "send", visitor, twinId });
      void stream(twinId, text, thread);
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
      void stream(twinId, visitor.text, thread);
    },
    [stream, thread],
  );

  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const dismissDisclosure = useCallback(() => dispatch({ type: "dismissDisclosure" }), []);

  const pending = thread.messages.some((m) => m.status === "waiting" || m.status === "streaming");
  const lastTwin = [...thread.messages].reverse().find((m) => m.role === "twin");
  const lockedUntil =
    lastTwin?.errorKind === "rate_limited" && lastTwin.retryAfterS ? lastTwin.createdAt + lastTwin.retryAfterS * 1000 : 0;
  const resting = lastTwin?.errorKind === "cap_exceeded";

  return { thread, loaded, online, pending, lockedUntil, resting, send, retry, clear, dismissDisclosure };
}
