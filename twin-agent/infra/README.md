# AI twin: setup (all-Vercel, D17)

One Vercel project runs two **Services** (`vercel.json`):
- `web`: the Next.js site (repo root)
- `twin`: the FastAPI + LangGraph agent (`twin-agent/`), reachable at `/api/twin/*`

The agent calls Gemini with credentials stored in Vercel env. Rate limits and the daily
spend cap live in Upstash Redis. GitHub Actions is the quality gate and Vercel Deployment
Checks hold production until it passes.

## 0. Security first (T0)
1. Resend dashboard → API Keys: revoke the key that was committed in `.env.example`, create a new one, and put it only in Vercel env and `.env.local`.
2. `.env.example` holds placeholders only. Rotating the key is the actual fix.

## 1. Gemini credentials (pick one)
**A. Vertex AI (recommended: uses your GCP credit, enterprise data terms)**
1. GCP Console → IAM → Service Accounts → create `twin-vertex`.
2. Grant it **only** `Vertex AI User` (`roles/aiplatform.user`).
3. Keys → Add key → JSON, then base64-encode it: `base64 -w0 key.json`.
4. Vercel → Project → Settings → Environment Variables:
   - `GOOGLE_SERVICE_ACCOUNT_B64`: the base64 string
   - `GCP_PROJECT_ID`: your project id
   - `GCP_LOCATION=global` (the global endpoint has the most Gemini capacity; it avoided the 429s seen on `us-central1`)
5. Delete `key.json` from disk.

**B. Gemini Developer API (simplest)**: AI Studio → API key → set `GEMINI_API_KEY` in Vercel. The free tier may use your prompts to improve Google's products; a paid key doesn't.

Retire the old key used by the removed `/api/chat` route: GCP → that service account → Keys → delete. Then delete the local `service_account.json`.

## 2. Upstash Redis (rate limits + spend cap)
Vercel → Project → Storage / Marketplace → **Upstash for Redis** → Create (free tier) → Connect to this project.
This injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

## 3. Remaining env vars (Vercel, Production + Preview)
| Name | Value |
|---|---|
| `IP_HASH_SECRET` | `openssl rand -hex 32` |
| `TWIN_DAILY_USD_CAP` | e.g. `2.0` (USD per Asia/Dhaka day; the twin "rests" after) |
| `TWIN_MODEL_FAST` | `gemini-2.5-flash` (must exist in `twin-agent/app/pricing.py`, else the function refuses to start) |

## 3b. Optional features (each stays off until its variables exist)
| Feature | Variables | How to get them |
|---|---|---|
| **Bot check** (invisible Turnstile, phase 1b) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TWIN_SESSION_SECRET` | Cloudflare → Turnstile → Add widget (mode **Managed**, your domain) gives the site and secret keys. `TWIN_SESSION_SECRET` = `openssl rand -hex 32`. |
| **Conversation logs + insights** (phase 4) | `TWIN_LOG_CONVERSATIONS=true` **and** `NEXT_PUBLIC_TWIN_LOGGING=true` (the second shows the 90-day notice in the chat) | Stored in Upstash for 90 days: question, answer, language, latency. No IP. |
| **Admin page** `/admin/insights` | `ADMIN_PASSWORD_HASH`, `TWIN_ADMIN_SECRET` | `cd twin-agent && .venv/bin/python -m app.gate hash-password` prints the hash. `TWIN_ADMIN_SECRET` = `openssl rand -hex 32` (must differ from the session secret). |
| Voice replies | `TWIN_TTS_MODEL` (default `gemini-2.5-flash-preview-tts`), `TWIN_VOICE_EN` / `TWIN_VOICE_BN` (default `Charon`) | Optional overrides. |
| Turn images/voice off | `NEXT_PUBLIC_TWIN_IMAGES=false` / `NEXT_PUBLIC_TWIN_VOICE=false` | Both are on by default. |

Images (≤1.5 MB after the client resizes them) and voice clips (≤60 s) fit under Vercel's 4.5 MB request limit.

## 4. Quality gate
1. GitHub → repo → Settings → Secrets → Actions: add `GOOGLE_SERVICE_ACCOUNT_B64`, the same key as step 1, or a separate eval-only key with the same single role. Without it the eval step is skipped, not failed.
2. Vercel → Project → Settings → **Deployment Checks**: select the `web` and `agent` checks from `twin-ci`. Production waits for them. Don't also add them as GitHub branch-protection required checks; Vercel's docs warn the two race.

## 5. Cost backstops (eng D11, re-mapped)
- Vercel → Settings → **Spend Management**: set a monthly limit with a pause.
- GCP → Billing → Budgets & alerts: email at 50/90/100% of a monthly budget, e.g. $10.
- GCP → IAM & Admin → Quotas: lower "Generate content requests per minute" for `gemini-2.5-flash`, e.g. 60/min.
- App cap: `TWIN_DAILY_USD_CAP` (above).

## 6. Deploy and check
1. Merge to `main` (or push). Vercel builds both services in one deployment, so there's no cutover ordering.
2. Open `https://<your-domain>/api/twin/healthz`. It should return `{"ok": true, "docs": 19}` or more.
3. Ask one question each in English, বাংলা and Banglish on phone and desktop.
4. Check that `/api/chat` (the old bot) returns 404.
5. Send a photo, a voice note, and tap ▶ on a reply.
6. If logging is on, sign in at `/admin/insights`.

## Local development
```bash
cd twin-agent && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt && cd ..
npm run twin:corpus                      # after editing src/content, content/twin, CV/docx or blog
GOOGLE_APPLICATION_CREDENTIALS=$PWD/service_account.json GCP_PROJECT_ID=<id> GCP_LOCATION=global npm run twin:dev   # :8080
TWIN_DEV_AGENT_URL=http://localhost:8080 npm run dev                                                                # site
```
Or `vercel dev`, which runs both services together (see Vercel Services docs).

The corpus (`twin-agent/data/*.json`) is committed: CI fails if it is stale, so run `npm run twin:corpus` and commit whenever its sources change.
