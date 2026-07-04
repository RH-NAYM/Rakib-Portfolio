# Rakib Portfolio — v2 (Next.js)

Personal portfolio of **MD Rakibul Hasan Naym** — Applied AI Engineer & AI Team Lead.
Rebuilt from the previous FastAPI/Jinja site into a modern **Next.js (App Router) + TypeScript + Tailwind v4** app.

> The old site is preserved in [`legacy-fastapi-site/`](./legacy-fastapi-site) and is not used by this build.

## Stack

- **Next.js 15** (App Router, React 19, Server Components)
- **TypeScript** + **Tailwind CSS v4** (CSS-first design tokens)
- **Vertex AI (Gemini)** for the AI assistant — `google-auth-library` + REST
- **Resend** for the contact form
- Markdown/MDX blog via `gray-matter` + `react-markdown`
- Deployed on **Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values (see SETUP.md)
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

## Project structure

```
src/
  app/                 App Router routes
    page.tsx           Home (hero, about, skills, work, experience, contact)
    work/[slug]/       Case-study pages
    projects/          Full 55-repo index (filterable)
    blog/ , blog/[slug]/   Markdown/MDX blog
    api/chat/          Vertex AI chatbot endpoint
    api/contact/       Resend contact endpoint
    sitemap.ts, robots.ts
  components/          UI + section components
  content/            Ground-truth data (site.ts, projects.ts) + blog/*.mdx
  lib/                vertex.ts, chat-prompt.ts, blog.ts
public/               Optimized profile image + résumé PDF
```

## Editing content

Almost everything renders from typed data — no hunting through markup:

- **Bio, title, skills, experience, metrics** → `src/content/site.ts`
- **Case studies + all 55 repos** → `src/content/projects.ts`
- **Blog posts** → add a `.mdx` file to `content/blog/` (see `_authoring-guide.mdx`)

To switch the headline title from "Applied AI Engineer & AI Team Lead" to "Head of AI",
change `profile.title` in `src/content/site.ts`.

## Deploy

This project is **local-only** in this repo state. See [SETUP.md](./SETUP.md) for the environment
variables and third-party accounts you need before deploying to Vercel yourself.
