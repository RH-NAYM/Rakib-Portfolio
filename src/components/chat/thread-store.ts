import type { ErrorEvent, FinalEvent, Media, MetaEvent, Source, StepEvent, Trace } from "@/lib/twin-events";
import type { UiLang } from "./strings";

/** Thread shape version. The thread is in-memory only now; this guards stale copies. */
export const SCHEMA = 2;
/** Where older builds persisted the chat. Kept only so it can be deleted on load. */
export const LEGACY_STORAGE_KEY = "twin-thread";
export const MAX_QUOTE = 1000;

export type Step = { step: StepEvent["step"]; status: StepEvent["status"] };
export type TwinErrorKind = ErrorEvent["kind"] | "partial" | "offline" | "verify_failed";
export type LangChoice = "auto" | UiLang;

/** What the visitor attached. Bytes are never stored (stateless media, eng R1-10): only a small thumb / waveform. */
export type Attachment =
  | { kind: "image"; thumb: string; description?: string }
  | { kind: "audio"; durationS: number; waveform: number[]; transcript?: string };

export type Quote = { id: string; role: "visitor" | "twin"; text: string; thumb?: string };

export type Msg = {
  id: string;
  role: "visitor" | "twin";
  text: string;
  createdAt: number;
  status?: "sending" | "sent" | "waiting" | "streaming" | "done" | "error";
  replyToVisitorId?: string; // twin msg → the visitor message it answers (Retry)
  quote?: Quote; // visitor msg → the bubble it replies to (design 1b reply-to)
  attachment?: Attachment;
  lang?: UiLang;
  steps?: Step[];
  sources?: Source[];
  media?: Media[];
  card?: FinalEvent["card"];
  trace?: Trace;
  errorKind?: TwinErrorKind;
  retryAfterS?: number;
};

export type Thread = {
  schema: number;
  messages: Msg[];
  uiLang: UiLang;
  langChoice: LangChoice;
  disclosureDismissed: boolean;
};

export const emptyThread = (uiLang: UiLang = "en"): Thread => ({
  schema: SCHEMA,
  messages: [],
  uiLang,
  langChoice: "auto",
  disclosureDismissed: false,
});

export type Action =
  | { type: "load"; thread: Thread }
  | { type: "send"; visitor: Msg; twinId: string }
  | { type: "step"; twinId: string; event: StepEvent }
  | { type: "meta"; twinId: string; event: MetaEvent }
  | { type: "lang"; lang: UiLang }
  | { type: "langChoice"; choice: LangChoice }
  | { type: "token"; twinId: string; text: string }
  | { type: "final"; twinId: string; event: FinalEvent }
  | { type: "error"; twinId: string; kind: TwinErrorKind; retryAfterS?: number }
  | { type: "retry"; twinId: string }
  | { type: "editTranscript"; visitorId: string; text: string }
  | { type: "clear" }
  | { type: "dismissDisclosure" };

function patch(t: Thread, id: string, f: (m: Msg) => Msg): Thread {
  return { ...t, messages: t.messages.map((m) => (m.id === id ? f(m) : m)) };
}

function followLang(t: Thread, lang: UiLang | undefined): Thread {
  // Explicit choice wins; in Auto the UI follows the visitor's language (design 7C).
  if (!lang) return t;
  return { ...t, uiLang: t.langChoice === "auto" ? lang : t.langChoice };
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
    case "meta": {
      const twin = t.messages.find((m) => m.id === a.twinId);
      let next = followLang(t, a.event.lang);
      if (twin?.replyToVisitorId && (a.event.transcript !== undefined || a.event.image_description)) {
        next = patch(next, twin.replyToVisitorId, (m) => {
          if (m.attachment?.kind === "audio" && a.event.transcript !== undefined)
            return { ...m, text: a.event.transcript ?? "", attachment: { ...m.attachment, transcript: a.event.transcript } };
          if (m.attachment?.kind === "image" && a.event.image_description)
            return { ...m, attachment: { ...m.attachment, description: a.event.image_description } };
          return m;
        });
      }
      return next;
    }
    case "lang":
      return followLang(t, a.lang);
    case "langChoice":
      return { ...t, langChoice: a.choice, uiLang: a.choice === "auto" ? t.uiLang : a.choice };
    case "token":
      return markSent(patch(t, a.twinId, (m) => ({ ...m, status: "streaming", text: m.text + a.text })), a.twinId);
    case "final":
      return markSent(
        patch(followLang(t, a.event.lang), a.twinId, (m) => ({
          ...m,
          status: "done",
          text: a.event.text,
          lang: a.event.lang,
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
    case "editTranscript":
      return patch(t, a.visitorId, (m) => ({ ...m, text: a.text }));
    case "clear":
      return { ...emptyThread(t.uiLang), langChoice: t.langChoice, disclosureDismissed: t.disclosureDismissed };
    case "dismissDisclosure":
      return { ...t, disclosureDismissed: true };
  }
}

function markSent(t: Thread, twinId: string): Thread {
  const twin = t.messages.find((m) => m.id === twinId);
  if (!twin?.replyToVisitorId) return t;
  return patch(t, twin.replyToVisitorId, (m) => (m.status === "sending" ? { ...m, status: "sent" } : m));
}

/** Plain text of a message for quoting/history: citation markers removed, image/voice described. */
export function plainText(m: Msg): string {
  // Drop citation markers and the answer's line markers ("## ", "- ", "  - ") so quotes and speech read as prose.
  const base = m.text
    .replace(/\[\[\d+\]\]/g, "")
    .replace(/^[ \t]*(?:#{2}|-)[ \t]+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (m.attachment?.kind === "image") return `[image${m.attachment.description ? `: ${m.attachment.description}` : ""}] ${base}`.trim();
  return base;
}

/** The quote snapshot stored on a reply. Snapshotting means trimmed-out messages still quote fine (design 2A). */
export function quoteOf(m: Msg): Quote {
  return { id: m.id, role: m.role, text: plainText(m).slice(0, MAX_QUOTE), thumb: m.attachment?.kind === "image" ? m.attachment.thumb : undefined };
}

/** History sent to the server: completed turns only, newest last (server caps at 12; all treated as unverified). */
export function historyFor(t: Thread, beforeId: string): Array<{ role: "user" | "assistant"; text: string }> {
  const out: Array<{ role: "user" | "assistant"; text: string }> = [];
  for (const m of t.messages) {
    if (m.id === beforeId) break;
    const text = plainText(m);
    if (m.role === "visitor" && text) out.push({ role: "user", text });
    if (m.role === "twin" && m.status === "done" && text) out.push({ role: "assistant", text });
  }
  return out.slice(-12);
}

/** A message still waiting/streaming when its component unmounted can't resume; mark it cut off. */
export function settleInFlight(t: Thread): Thread {
  return {
    ...t,
    messages: t.messages.map((m) =>
      m.status === "waiting" || m.status === "streaming"
        ? { ...m, status: "error" as const, errorKind: (m.text ? "partial" : "upstream_unavailable") as TwinErrorKind }
        : m,
    ),
  };
}
