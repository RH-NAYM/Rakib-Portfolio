import "server-only";
import { GoogleAuth, IdentityPoolClient, Impersonated } from "google-auth-library";

/**
 * Mints a Google ID token so the private Cloud Run twin-agent accepts the call.
 *
 * Production (eng D10): Vercel OIDC → GCP Workload Identity Federation → impersonate
 * `twin-vercel-invoker` (roles/run.invoker only). No long-lived key anywhere.
 *   env: GCP_PROJECT_NUMBER, GCP_WIF_POOL_ID, GCP_WIF_PROVIDER_ID, TWIN_INVOKER_SA
 * Local dev: GOOGLE_APPLICATION_CREDENTIALS key file, or no auth for a localhost agent.
 */

let impersonated: Impersonated | null = null;

function vercelOidcToken(headers: Headers): string {
  const token = headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN;
  if (!token) throw new Error("Vercel OIDC token unavailable (enable OIDC Federation in Vercel project settings).");
  return token;
}

function wifClient(headers: Headers): Impersonated {
  const { GCP_PROJECT_NUMBER, GCP_WIF_POOL_ID, GCP_WIF_PROVIDER_ID, TWIN_INVOKER_SA } = process.env;
  const source = new IdentityPoolClient({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WIF_POOL_ID}/providers/${GCP_WIF_PROVIDER_ID}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    subject_token_supplier: { getSubjectToken: async () => vercelOidcToken(headers) },
  });
  return new Impersonated({
    sourceClient: source,
    targetPrincipal: TWIN_INVOKER_SA,
    targetScopes: ["https://www.googleapis.com/auth/cloud-platform"],
    lifetime: 3600,
  });
}

export async function agentAuthHeaders(audience: string, headers: Headers): Promise<Record<string, string>> {
  if (/^http:\/\/(localhost|127\.0\.0\.1)/.test(audience)) return {};
  if (process.env.GCP_WIF_PROVIDER_ID) {
    // The OIDC token can rotate per request, so the source client is rebuilt each time;
    // the impersonated ID token is cheap to fetch and Cloud Run tolerates it for 1h.
    impersonated = wifClient(headers);
    const idToken = await impersonated.fetchIdToken(audience, { includeEmail: true });
    return { Authorization: `Bearer ${idToken}` };
  }
  const client = await new GoogleAuth().getIdTokenClient(audience);
  return (await client.getRequestHeaders()) as Record<string, string>;
}
