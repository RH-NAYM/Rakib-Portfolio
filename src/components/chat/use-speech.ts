"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UiLang } from "./strings";

export type SpeechState = "idle" | "loading" | "playing" | "blocked" | "error";

/**
 * Twin voice replies (phase 3, design 7B): ▶ idle → spinner (fetching TTS) → ❚❚ playing.
 * Autoplay is attempted only after the visitor used the mic; if the browser blocks it
 * (iOS needs a gesture) the button shows "Tap ▶ to hear me" instead of failing silently.
 */
export function useSpeech() {
  const [states, setStates] = useState<Record<string, SpeechState>>({});
  const urls = useRef(new Map<string, string>());
  const audio = useRef<HTMLAudioElement | null>(null);
  const current = useRef<string | null>(null);

  const set = (id: string, s: SpeechState) => setStates((p) => ({ ...p, [id]: s }));

  useEffect(
    () => () => {
      audio.current?.pause();
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const stop = useCallback(() => {
    audio.current?.pause();
    if (current.current) set(current.current, "idle");
    current.current = null;
  }, []);

  const play = useCallback(
    async (id: string, text: string, lang: UiLang, auto = false) => {
      if (current.current === id) return stop();
      stop();
      current.current = id;
      let url = urls.current.get(id);
      if (!url) {
        set(id, "loading");
        try {
          const r = await fetch("/api/twin/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.slice(0, 1500), lang }),
          });
          if (!r.ok) throw new Error(`tts ${r.status}`);
          url = URL.createObjectURL(await r.blob());
          urls.current.set(id, url);
        } catch {
          set(id, "error");
          current.current = null;
          return;
        }
      }
      if (current.current !== id) return; // visitor started another clip meanwhile
      audio.current ??= new Audio();
      const a = audio.current;
      a.src = url;
      a.onended = () => {
        set(id, "idle");
        current.current = null;
      };
      try {
        await a.play();
        set(id, "playing");
      } catch {
        set(id, auto ? "blocked" : "error");
        current.current = null;
      }
    },
    [stop],
  );

  return { states, play, stop };
}
