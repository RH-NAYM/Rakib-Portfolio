# twin-agent infrastructure runbook

`gcloud` isn't installed on the dev machine, so these steps are run by hand once.
Commands assume:

```bash
export PROJECT_ID=<your-gcp-project-id>
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export REGION=asia-south1          # Cloud Run + Artifact Registry + Firestore (closest to Dhaka)
export VERTEX_LOCATION=us-central1 # check Gemini availability in asia-south1 first; use it if available
export GITHUB_REPO=RH-NAYM/Rakib-Portfolio
export VERCEL_TEAM=<your-vercel-team-slug>   # Vercel → Settings → General
export VERCEL_PROJECT=<your-vercel-project-name>
gcloud config set project $PROJECT_ID
```

## 0. Security first (T0)
1. Resend dashboard → API Keys → revoke the key that was committed in `.env.example`, then create a new one. Put the new key in Vercel env and `.env.local` only.
2. `.env.example` now holds placeholders only. If the repo is public, treat the old key and project id as exposed. Rotating the key is the actual fix; scrubbing history is optional.

## 1. APIs, registry, database, secrets
```bash
gcloud services enable aiplatform.googleapis.com run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com firestore.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com texttospeech.googleapis.com
gcloud artifacts repositories create twin --repository-format=docker --location=$REGION
gcloud firestore databases create --location=$REGION --type=firestore-native   # same region as Cloud Run (eng D14)
openssl rand -hex 32 | gcloud secrets create ip-hash-secret --data-file=-
printf '%s' '<github-token-with-public-repo-read>' | gcloud secrets create github-token --data-file=-
```

## 2. Service accounts (least privilege)
```bash
for sa in twin-runtime twin-build twin-vercel-invoker twin-ci-evals; do
  gcloud iam service-accounts create $sa; done
SA() { echo "$1@$PROJECT_ID.iam.gserviceaccount.com"; }

# runtime: Vertex, Firestore, logs, its own secret
for r in roles/aiplatform.user roles/datastore.user roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$(SA twin-runtime) --role=$r; done
gcloud secrets add-iam-policy-binding ip-hash-secret --member=serviceAccount:$(SA twin-runtime) --role=roles/secretmanager.secretAccessor

# build: embeddings/evals (Vertex), deploy revisions (not service IAM), push images, logs, github token
for r in roles/aiplatform.user roles/run.developer roles/artifactregistry.writer roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$(SA twin-build) --role=$r; done
gcloud iam service-accounts add-iam-policy-binding $(SA twin-runtime) --member=serviceAccount:$(SA twin-build) --role=roles/iam.serviceAccountUser
gcloud secrets add-iam-policy-binding github-token --member=serviceAccount:$(SA twin-build) --role=roles/secretmanager.secretAccessor

# CI evals: Vertex only
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$(SA twin-ci-evals) --role=roles/aiplatform.user
```
`twin-vercel-invoker` gets `roles/run.invoker` on the service after the first deploy (step 5).

## 3. Workload Identity Federation (no JSON keys anywhere: eng D10)
```bash
gcloud iam workload-identity-pools create twin-pool --location=global

# GitHub Actions → twin-ci-evals
gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=twin-pool \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'"
gcloud iam service-accounts add-iam-policy-binding $(SA twin-ci-evals) --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/twin-pool/attribute.repository/$GITHUB_REPO"

# Vercel (enable "OIDC Federation" in Vercel project settings, Team issuer mode) → twin-vercel-invoker
gcloud iam workload-identity-pools providers create-oidc vercel --location=global --workload-identity-pool=twin-pool \
  --issuer-uri=https://oidc.vercel.com/$VERCEL_TEAM \
  --allowed-audiences=https://vercel.com/$VERCEL_TEAM \
  --attribute-mapping=google.subject=assertion.sub,attribute.project=assertion.project \
  --attribute-condition="assertion.project=='$VERCEL_PROJECT'"
gcloud iam service-accounts add-iam-policy-binding $(SA twin-vercel-invoker) --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/twin-pool/attribute.project/$VERCEL_PROJECT"
gcloud iam service-accounts add-iam-policy-binding $(SA twin-vercel-invoker) --role=roles/iam.serviceAccountTokenCreator \
  --member=serviceAccount:$(SA twin-vercel-invoker)   # lets the federated identity mint its own ID token
```
GitHub repo → Settings → Variables: `GCP_WIF_PROVIDER_GITHUB=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/twin-pool/providers/github`, `TWIN_CI_EVALS_SA=twin-ci-evals@…`, `GCP_PROJECT_ID`.

## 4. Cost backstops (eng D11)
- `--max-instances=3` is set in `cloudbuild.yaml`.
- Vertex quota: Console → IAM & Admin → Quotas → filter "Generate content requests per minute per base model" for `gemini-2.5-flash` in `$VERTEX_LOCATION`, and request a lower override (e.g. 60/min).
- Budget alert email at 50/90/100% of your monthly budget:
```bash
gcloud billing budgets create --billing-account=<BILLING_ACCOUNT_ID> --display-name=twin-monthly \
  --budget-amount=10USD --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```
- App cap: `_DAILY_CAP` substitution in `cloudbuild.yaml` (USD per Asia/Dhaka day).

## 5. Build trigger and first deploy
```bash
gcloud builds triggers create github --name=twin-agent --repo-owner=RH-NAYM --repo-name=Rakib-Portfolio \
  --branch-pattern='^main$' --build-config=twin-agent/cloudbuild.yaml \
  --service-account=projects/$PROJECT_ID/serviceAccounts/$(SA twin-build) \
  --included-files='twin-agent/**,content/twin/**,src/content/**,contracts/**,scripts/export-content.ts'
gcloud builds triggers run twin-agent --branch=main     # or push to main
gcloud run services add-iam-policy-binding twin-agent --region=$REGION \
  --member=serviceAccount:$(SA twin-vercel-invoker) --role=roles/run.invoker
```
Smoke test: `curl -s -o /dev/null -w '%{http_code}' $(gcloud run services describe twin-agent --region=$REGION --format='value(status.url)')/healthz` must print **403** (private service).

## 6. Cutover runbook (eng D9, order matters)
1. Cloud Run `twin-agent` is live and step 5's 403 smoke test passes.
2. Vercel env (Production): `TWIN_AGENT_URL=<cloud run url>`, `GCP_PROJECT_NUMBER`, `GCP_WIF_POOL_ID=twin-pool`, `GCP_WIF_PROVIDER_ID=vercel`, `TWIN_INVOKER_SA=twin-vercel-invoker@…`. Remove `GOOGLE_SERVICE_ACCOUNT_B64`.
3. Deploy the site (merge to main). The new chat shell talks to `/api/twin/chat`.
4. Check a real question in all three languages on phone and desktop.
5. Delete the old route and client (`src/app/api/chat/`, `src/lib/vertex.ts`, `src/lib/chat-prompt.ts`, `src/components/chat-widget*.tsx`) in a follow-up deploy, then confirm `/api/chat` returns 404.
6. Delete the old service-account key: `gcloud iam service-accounts keys list --iam-account=<old-sa>` → `keys delete <id>`. Delete the local `service_account.json` once nothing uses it.

## Local development
```bash
cd twin-agent && python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
npx tsx ../scripts/export-content.ts && .venv/bin/python -m ingest.build_corpus
TWIN_ENV=test TWIN_LIMITS_BACKEND=memory GOOGLE_APPLICATION_CREDENTIALS=../service_account.json \
  GCP_PROJECT_ID=$PROJECT_ID GCP_LOCATION=$VERTEX_LOCATION .venv/bin/uvicorn app.api:app --port 8080
# in .env.local for the site: TWIN_AGENT_URL=http://localhost:8080
```
