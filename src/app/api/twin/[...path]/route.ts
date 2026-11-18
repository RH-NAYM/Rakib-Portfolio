import { agentAuthHeaders } from "@/lib/twin-auth";
import { clientIp, sseError } from "@/lib/twin-proxy";

/**
 * Catch-all proxy to the private Cloud Run twin-agent (eng D2).
 * - authenticates with a Google ID token (WIF in prod, see twin-auth.ts)
 * - forwards the visitor IP (first hop only) as X-Twin-Client-IP
 * - streams SSE through untouched
 * - maps upstream failures and a 25s no-response timeout to a typed `error` event (eng D3)
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set(["chat"]); // phase 3 adds "tts"
const FIRST_BYTE_TIMEOUT_MS = 25_000;
const MAX_BODY = 64 * 1024; // text turns only in 1a; media arrives in phase 2

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join("/");
  if (!ALLOWED.has(target)) return new Response("Not found", { status: 404 });

  const base = process.env.TWIN_AGENT_URL;
  if (!base) return sseError("upstream_unavailable");

  const body = await req.text();
  if (body.length > MAX_BODY) return sseError("bad_request");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FIRST_BYTE_TIMEOUT_MS);
  req.signal.addEventListener("abort", () => controller.abort());

  try {
    const auth = await agentAuthHeaders(base, req.headers);
    const upstream = await fetch(`${base.replace(/\/$/, "")}/${target}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Twin-Client-IP": clientIp(req.headers), ...auth },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (upstream.status === 400) return sseError("bad_request");
    if (!upstream.ok || !upstream.body) return sseError("upstream_unavailable");
    return new Response(upstream.body, {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
    });
  } catch (err) {
    clearTimeout(timer);
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("[twin proxy]", err instanceof Error ? err.message : err);
    return sseError(controller.signal.aborted ? "timeout" : "upstream_unavailable");
  }
}
