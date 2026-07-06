import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { SiteBackground } from "@/components/site-background";
import { profile, metrics } from "@/content/site";

// The ambient backdrop (glow blobs + the dot/line particle constellation)
// is scoped to this section only — it fades to fully transparent before
// the bottom edge of Hero, so it never trails into About or later sections.
// See src/components/site-background.tsx.
export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-16">
      <SiteBackground />
      <div className="container-page py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-[--color-border-strong] bg-[--color-surface]/60 px-3 py-1.5 text-xs text-[--color-text-muted] backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[--color-success] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[--color-success]" />
          </span>
          {profile.availability}
        </div>

        <p className="mt-8 font-mono text-sm text-[--color-accent]">// Hello, I&apos;m</p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {profile.name}
        </h1>
        <h2 className="mt-4 text-xl font-medium text-[--color-text] sm:text-2xl">
          <span className="text-gradient">{profile.title}</span>
        </h2>
        <p className="mt-2 font-mono text-sm text-[--color-text-muted] sm:text-base">
          {profile.tagline}
        </p>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[--color-text-muted] sm:text-lg">
          {profile.positioning}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent] px-5 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 glow-accent"
          >
            View Featured Work <ArrowUpRight size={16} />
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-lg border border-[--color-border-strong] px-5 py-3 text-sm font-semibold text-[--color-text] transition-all duration-200 hover:-translate-y-0.5 hover:border-[--color-accent] hover:text-[--color-accent] active:translate-y-0 active:scale-95"
          >
            Get in Touch
          </Link>
          <a
            href="/Rakibul_Hasan_Naym_CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-[--color-text-muted] transition-all duration-200 hover:-translate-y-0.5 hover:text-[--color-text] active:translate-y-0 active:scale-95"
          >
            <Download size={15} /> Resume
          </a>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[--color-border] bg-[--color-border] sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <div key={m.label} className="bg-[--color-bg] px-4 py-5">
              <dt className="font-mono text-2xl font-semibold text-[--color-accent] sm:text-3xl">
                {m.value}
              </dt>
              <dd className="mt-1 text-xs leading-tight text-[--color-text-muted]">{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
