# Setup & Manual Steps

Everything below is stuff **you** need to do — I can't create third-party accounts or set secrets
on your behalf. The site runs and builds without any of these; the contact form and AI chatbot just
show a friendly "not configured yet" message until you add the keys.

---

## 0. Run it locally

```bash
cd Rakib-Portfolio
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

---

## 1. Contact form — Resend  (required for the form to send email)

1. Create a free account at **https://resend.com**.
2. **API Keys → Create API Key**, copy it.
3. (Recommended) **Domains → Add Domain** and verify your domain so email comes *from* you.
   Until then you can use Resend's sandbox sender `onboarding@resend.dev`.
4. Set these env vars (in `.env.local` locally, and in Vercel → Project → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend key |
   | `CONTACT_TO_EMAIL` | `naym.mj@gmail.com` (where messages land) |
   | `CONTACT_FROM_EMAIL` | `Portfolio <onboarding@resend.dev>` → later `Rakib <hello@yourdomain.com>` |

---

## 2. AI chatbot — Google Vertex AI  (required for the assistant to answer)

You already have the service account (`service_account.json`, project **`calm-sylph-440605-q7`**).

1. In **Google Cloud Console** for that project, **enable the Vertex AI API**
   (APIs & Services → Enable APIs → "Vertex AI API").
2. Make sure the service account (`he-805@calm-sylph-440605-q7.iam.gserviceaccount.com`) has the
   **Vertex AI User** role (IAM → grant `roles/aiplatform.user`).
3. Confirm the model/region: defaults are `gemini-2.0-flash-001` in `us-central1`. If that model
   isn't enabled in your project/region, change `VERTEX_MODEL` / `GCP_LOCATION` env vars.
4. **Provide the credentials — do NOT commit the JSON.**
   - **Local dev:** either set `GOOGLE_APPLICATION_CREDENTIALS=./service_account.json`, or base64 it (next line).
   - **Vercel (recommended):** base64-encode the key and store it as one env var:
     ```bash
     base64 -w0 service_account.json     # Linux
     base64 -i service_account.json      # macOS
     ```
     Paste the output into `GOOGLE_SERVICE_ACCOUNT_B64` in Vercel.
5. Set these env vars:

   | Variable | Value |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_B64` | base64 of service_account.json (Vercel) |
   | `GOOGLE_APPLICATION_CREDENTIALS` | `./service_account.json` (local only, optional) |
   | `GCP_PROJECT_ID` | `calm-sylph-440605-q7` |
   | `GCP_LOCATION` | `us-central1` |
   | `VERTEX_MODEL` | `gemini-2.0-flash-001` |

> **Security:** `service_account.json` is already in `.gitignore`. Because it sat un-ignored earlier,
> consider **rotating the key** in GCP (create a new key, update the env var, delete the old one).

---

## 3. Deploy to Vercel  (when you're ready — I did NOT deploy anything)

1. Push this repo to GitHub (the `RH-NAYM/Rakib-Portfolio` remote is already set).
   - The Vercel project currently deploys the **old Python app**. In Vercel → Settings → General,
     make sure the **Framework Preset is "Next.js"** (remove any leftover `@vercel/python` config).
     There is no `vercel.json` in the new root, so Vercel will auto-detect Next.js.
2. Add all env vars from steps 1–2 in Vercel (Production + Preview).
3. Deploy. The old `legacy-fastapi-site/` folder is ignored by the Next build.

---

## 4. Optional polish

- **Résumé:** `public/Rakibul_Hasan_Naym_CV.pdf` was generated from your CV. Replace it anytime.
- **Profile image:** `public/profile.webp` (optimized to ~72 KB). Swap in a new one at the same path.
- **LinkedIn URL:** I used the profile URL from your old site — double-check it in `src/content/site.ts`.
- **Blog:** add real posts in `content/blog/`. The old article titles are listed in the authoring guide.
- **Kaggle / Google Scholar:** removed because the old links looked like placeholders. Add real URLs to
  `src/content/site.ts` (`socials`) if you have them.

---

## Quick reference — all env vars

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=naym.mj@gmail.com
CONTACT_FROM_EMAIL=Portfolio <onboarding@resend.dev>
GOOGLE_SERVICE_ACCOUNT_B64=
# or GOOGLE_APPLICATION_CREDENTIALS=./service_account.json   (local)
GCP_PROJECT_ID=calm-sylph-440605-q7
GCP_LOCATION=us-central1
VERTEX_MODEL=gemini-2.0-flash-001
```
