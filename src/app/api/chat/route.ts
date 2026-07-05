import { NextResponse } from "next/server";
import { generateVertexReply, type ChatTurn } from "@/lib/vertex";
import { buildSystemPrompt } from "@/lib/chat-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MESSAGE = 2000;

export async function POST(req: Request) {
  let body: { message?: string; history?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = (body.message || "").toString().trim().slice(0, MAX_MESSAGE);
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
        .slice(-10)
    : [];

  const hasCreds =
    !!process.env.GOOGLE_SERVICE_ACCOUNT_B64 || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!hasCreds) {
    return NextResponse.json(
      {
        error:
          "The AI assistant isn't configured yet. Please reach out via the contact form or email naym.mj@gmail.com.",
      },
      { status: 503 }
    );
  }

  try {
    const reply = await generateVertexReply(buildSystemPrompt(), history, message);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] Vertex AI error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "The assistant is temporarily unavailable. Please try again or use the contact form.",
        // Only leak the real cause outside production so it's easy to debug
        // locally (auth/permission/model errors all show up here instead of
        // just in the server terminal).
        ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
      },
      { status: 502 }
    );
  }
}
