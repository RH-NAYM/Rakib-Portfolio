import type { TwinEvent } from "./twin-events.generated";

export type * from "./twin-events.generated";

const KNOWN = new Set(["step", "meta", "token", "final", "error"]);

/**
 * Incremental SSE parser. Handles events split across network chunks and
 * several events in one chunk. Unknown event types, unknown versions and
 * malformed frames are ignored (eng D9: mixed-version deploys degrade quietly).
 */
export function createSSEParser(onEvent: (e: TwinEvent) => void) {
  let buffer = "";
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, "\n");
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).replace(/^ /, ""))
        .join("\n");
      if (!data) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      const e = parsed as { v?: unknown; type?: unknown };
      if (e && e.v === 1 && typeof e.type === "string" && KNOWN.has(e.type)) onEvent(parsed as TwinEvent);
    }
  };
}

/** Split an answer into text and citation markers ([[n]] → superscript n). */
export function splitCitations(text: string): Array<{ text: string } | { cite: number }> {
  const out: Array<{ text: string } | { cite: number }> = [];
  const re = /\[\[(\d+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ cite: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
