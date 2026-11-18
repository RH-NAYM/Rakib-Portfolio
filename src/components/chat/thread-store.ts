import type { ErrorEvent, FinalEvent, Media, Source, StepEvent, Trace } from "@/lib/twin-events";
import type { UiLang } from "./strings";

/** Persisted thread shape. Bump SCHEMA when it changes; old threads are cleared silently (design 2A). */
export const SCHEMA = 1;
export const STORAGE_KEY = "twin-thread";
export const MAX_STORED = 60;

export type Step = { step: StepEvent["step"]; status: StepEvent["status"] };
export type TwinErrorKind = ErrorEvent["kind"] | "partial" | "offline";

export type Msg = {
  id: string;
  role: "visitor" | "twin";
  text: string;
  createdAt: number;
  status?: "sending" | "sent" | "waiting" | "streaming" | "done" | "error";
  replyToVisitorId?: string; // twin msg → the visitor message it answers (used by Retry)
  steps?: Step[];
  sources?: Source[];
  media?: Media[];
  card?: FinalEvent["card"];
  trace?: Trace;
  errorKind?: TwinErrorKind;
  retryAfterS?: number;
};

export type Thread = { schema: number; messages: Msg[]; uiLang: UiLang; disclosureDismissed: boolean };

export const emptyThread = (uiLang: UiLang = "en"): Thread => ({ schema: SCHEMA, messages: [], uiLang, disclosureDismissed: false });

export type Action =
  | { type: "load"; thread: Thread }
  | { type: "send"; visitor: Msg; twinId: string }
  | { type: "step"; twinId: string; event: StepEvent }
  | { type: "lang"; lang: UiLang }
  | { type: "token"; twinId: string; text: string }
  | { type: "final"; twinId: string; event: FinalEvent }
  | { type: "error"; twinId: string; kind: TwinErrorKind; retryAfterS?: number }
  | { type: "retry"; twinId: string }
  | { type: "clear" }
  | { type: "dismissDisclosure" };

function patch(t: Thread, id: string, f: (m: Msg) => Msg): Thread {
  return { ...t, messages: t.messages.map((m) => (m.id === id ? f(m) : m)) };
}

export function reducer(t: Thread, a: Action): Thread {
  switch (a.type) {
    case "load":
      return a.thread;
    case "send":
      return {
        ...t,
        messages: [
          ...t.messages,
          { ...a.visitor, status: "sending" },
          // First chip is rendered client-side immediately, covering cold starts (design 2B).
          { id: a.twinId, role: "twin", text: "", createdAt: a.visitor.createdAt, status: "waiting", replyToVisitorId: a.visitor.id, steps: [{ step: "planning", status: "active" }] },
        ],
      };
    case "step":
      return patch(t, a.twinId, (m) => {
        const steps = [...(m.steps ?? [])];
        const i = steps.findIndex((s) => s.step === a.event.step);
        if (i >= 0) steps[i] = { step: a.event.step, status: a.event.status };
        else steps.push({ step: a.event.step, status: a.event.status });
        return { ...m, steps };
      });
    case "lang":
      return { ...t, uiLang: a.lang };
    case "token":
      return markSent(patch(t, a.twinId, (m) => ({ ...m, status: "streaming", text: m.text + a.text })), a.twinId);
    case "final":
      return markSent(
        patch(t, a.twinId, (m) => ({
          ...m,
          status: "done",
          text: a.event.text,
          sources: a.event.sources,
          media: a.event.media,
          card: a.event.card,
          trace: a.event.trace,
          steps: m.steps?.map((s) => ({ ...s, status: "done" as const })),
        })),
        a.twinId,
      );
    case "error":
      return markSent(
        patch(t, a.twinId, (m) => ({
          ...m,
          status: "error",
          errorKind: m.text && a.kind !== "rate_limited" && a.kind !== "cap_exceeded" ? "partial" : a.kind,
          retryAfterS: a.retryAfterS,
        })),
        a.twinId,
      );
    case "retry":
      return patch(t, a.twinId, (m) => ({
        ...m,
        status: "waiting",
        text: "",
        errorKind: undefined,
        retryAfterS: undefined,
        steps: [{ step: "planning", status: "active" }],
      }));
    case "clear":
      return { ...emptyThread(t.uiLang), disclosureDismissed: t.disclosureDismissed };
    case "dismissDisclosure":
      return { ...t, disclosureDismissed: true };
  }
}

function markSent(t: Thread, twinId: string): Thread {
  const twin = t.messages.find((m) => m.id === twinId);
  if (!twin?.replyToVisitorId) return t;
  return patch(t, twin.replyToVisitorId, (m) => (m.status === "sending" ? { ...m, status: "sent" } : m));
}

/** History sent to the server: completed turns only, newest last (server caps at 12). */
export function historyFor(t: Thread, beforeId: string): Array<{ role: "user" | "assistant"; text: string }> {
  const out: Array<{ role: "user" | "assistant"; text: string }> = [];
  for (const m of t.messages) {
    if (m.id === beforeId) break;
    if (m.role === "visitor" && m.text) out.push({ role: "user", text: m.text });
    if (m.role === "twin" && m.status === "done" && m.text) out.push({ role: "assistant", text: m.text.replace(/\[\[\d+\]\]/g, "") });
  }
  return out.slice(-12);
}

export function loadThread(raw: string | null, fallbackLang: UiLang): Thread {
  if (!raw) return emptyThread(fallbackLang);
  try {
    const p = JSON.parse(raw) as Thread;
    if (p?.schema !== SCHEMA || !Array.isArray(p.messages)) return emptyThread(fallbackLang);
    // In-flight messages from a closed tab can't resume; mark them cut off.
    const messages = p.messages.map((m) =>
      m.status === "waiting" || m.status === "streaming" ? { ...m, status: "error" as const, errorKind: (m.text ? "partial" : "upstream_unavailable") as TwinErrorKind } : m,
    );
    return { ...p, messages };
  } catch {
    return emptyThread(fallbackLang);
  }
}

export function serializeThread(t: Thread): string {
  return JSON.stringify({ ...t, messages: t.messages.slice(-MAX_STORED) });
}
