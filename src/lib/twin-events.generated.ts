/* Generated from contracts/sse-events.schema.json by npm run gen:twin-types. Do not edit. */

/**
 * Server-sent events streamed by twin-agent /chat. Single source of truth for Python (api.py) and TypeScript (src/lib/twin-events.ts). Clients MUST ignore unknown `type` values and unknown fields (eng review D9).
 */
export type TwinEvent = StepEvent | MetaEvent | TokenEvent | FinalEvent | ErrorEvent;
export type Version = 1;
export type Lang = "en" | "bn" | "banglish";

export interface StepEvent {
  v: Version;
  type: "step";
  step: "planning" | "reading" | "checking" | "rechecking";
  status: "active" | "done";
  [k: string]: unknown;
}
/**
 * Side information. `lang` (when present) is the visitor's language; `transcript` is what the twin heard (voice); `image_description` is what it saw (upload).
 */
export interface MetaEvent {
  v: Version;
  type: "meta";
  lang?: Lang;
  transcript?: string;
  image_description?: string;
  [k: string]: unknown;
}
export interface TokenEvent {
  v: Version;
  type: "token";
  text: string;
  [k: string]: unknown;
}
export interface FinalEvent {
  v: Version;
  type: "final";
  msg_id: string;
  /**
   * Full answer. Citation markers are written as [[n]] and rendered by the client as superscripts.
   */
  text: string;
  lang: Lang;
  sources: Source[];
  media: Media[];
  card: "contact" | null;
  trace: Trace;
  [k: string]: unknown;
}
export interface Source {
  n: number;
  title: string;
  url: string;
  [k: string]: unknown;
}
export interface Media {
  id: string;
  src: string;
  caption: string;
  alt?: string;
  project_url?: string;
  [k: string]: unknown;
}
export interface Trace {
  plan: string[];
  source_count: number;
  revisions: number;
  elapsed_ms: number;
  critic: {
    passed: boolean;
    removed_sentences: number;
    fallback?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface ErrorEvent {
  v: Version;
  type: "error";
  kind: "upstream_unavailable" | "timeout" | "cap_exceeded" | "rate_limited" | "bad_request";
  retry_after_s?: number;
  [k: string]: unknown;
}
