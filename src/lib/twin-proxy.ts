/** Pure helpers for the twin proxy route (kept out of route.ts so they're unit-testable). */

export type ProxyErrorKind = "upstream_unavailable" | "timeout" | "bad_request";

export function sseError(kind: ProxyErrorKind): Response {
  return new Response(`data: ${JSON.stringify({ v: 1, type: "error", kind })}\n\n`, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

/** First hop only: later entries in x-forwarded-for are spoofable by the client. */
export function clientIp(headers: Headers): string {
  const raw = headers.get("x-vercel-forwarded-for") || headers.get("x-forwarded-for") || headers.get("x-real-ip") || "";
  return raw.split(",")[0]?.trim() || "0.0.0.0";
}
