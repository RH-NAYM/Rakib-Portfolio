import { GoogleAuth } from "google-auth-library";

/**
 * Vertex AI (Gemini) client using a Google Cloud service account.
 *
 * Credentials resolution order:
 *   1. GOOGLE_SERVICE_ACCOUNT_B64  — base64 of the service_account.json (recommended for Vercel)
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to a JSON key file (local dev)
 *
 * Required env:
 *   GCP_PROJECT_ID   (default: project_id from the key)
 *   GCP_LOCATION     (default: us-central1)
 *   VERTEX_MODEL     (default: gemini-2.0-flash-001)
 */

let cachedAuth: GoogleAuth | null = null;
let cachedProjectId: string | null = null;

function getCredentials(): { credentials?: object; projectId?: string } {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    return { credentials: json, projectId: json.project_id };
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS (a file path) automatically.
  return {};
}

function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;
  const { credentials, projectId } = getCredentials();
  cachedProjectId = process.env.GCP_PROJECT_ID || projectId || null;
  cachedAuth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return cachedAuth;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function generateVertexReply(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
): Promise<string> {
  const auth = getAuth();
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  if (!token) throw new Error("Failed to obtain Vertex AI access token.");

  const projectId = process.env.GCP_PROJECT_ID || cachedProjectId;
  if (!projectId) throw new Error("Missing GCP project id.");
  const location = process.env.GCP_LOCATION || "us-central1";
  const model = process.env.VERTEX_MODEL || "gemini-2.0-flash-001";

  const contents = [
    ...history.map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [{ text: t.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 800 },
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vertex AI error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
  return reply.trim() || "I don't have an answer for that right now.";
}
