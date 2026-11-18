"use client";

/**
 * Cloudflare Turnstile, invisible by default (design 2C): the widget only shows itself when
 * Cloudflare needs an interactive check (`appearance: "interaction-only"`). Off entirely until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 */
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

function load(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile blocked")); // ad blockers do this → caller shows the contact card
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Resolves with a one-time token; `onInteractive` fires if the visible challenge appears. */
export async function getTurnstileToken(container: HTMLElement, onInteractive: () => void, timeoutMs = 20_000): Promise<string> {
  const api = await load();
  return new Promise((resolve, reject) => {
    let id = "";
    const done = (fn: () => void) => {
      clearTimeout(timer);
      try {
        api.remove(id);
      } catch {}
      fn();
    };
    const timer = setTimeout(() => done(() => reject(new Error("turnstile timeout"))), timeoutMs);
    id = api.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: "interaction-only",
      callback: (token: string) => done(() => resolve(token)),
      "error-callback": () => done(() => reject(new Error("turnstile error"))),
      "before-interactive-callback": onInteractive,
    });
  });
}
