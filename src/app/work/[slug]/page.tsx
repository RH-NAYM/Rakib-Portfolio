import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { caseStudies, repos } from "@/content/projects";
import { Reveal } from "@/components/reveal";

export function generateStaticParams() {
  return caseStudies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) return { title: "Case Study" };
  return {
    title: study.title,
    description: study.subtitle,
    openGraph: { title: study.title, description: study.subtitle },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = caseStudies.findIndex((s) => s.slug === slug);
  if (idx === -1) notFound();
  const study = caseStudies[idx];
  const next = caseStudies[(idx + 1) % caseStudies.length];

  const relatedRepos = study.related
    .map((name) => repos.find((r) => r.name === name))
    .filter(Boolean);

  return (
    <article className="container-page pt-28 pb-8">
      <Link
        href="/work"
        className="inline-flex items-center gap-2 text-sm text-[--color-text-muted] transition-colors hover:text-[--color-accent]"
      >
        <ArrowLeft size={15} /> All work
      </Link>

      {/* Hero */}
      <Reveal className="mt-6">
        <p className="eyebrow">{study.domain}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {study.title}
        </h1>
        <p className="mt-2 text-sm text-[--color-text-faint]">{study.context}</p>
        <p className="mt-4 max-w-3xl text-lg text-[--color-text-muted]">{study.subtitle}</p>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {study.tags.map((t) => (
            <span key={t} className="rounded-md border border-[--color-border] px-2.5 py-1 font-mono text-xs text-[--color-text-muted]">
              {t}
            </span>
          ))}
        </div>
      </Reveal>

      {/* Metrics */}
      <Reveal className="mt-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[--color-border] bg-[--color-border] sm:grid-cols-4">
          {study.metrics.map((m) => (
            <div key={m.label} className="bg-[--color-bg] px-4 py-5">
              <dt className="font-mono text-2xl font-semibold text-[--color-accent]">{m.value}</dt>
              <dd className="mt-1 text-xs leading-tight text-[--color-text-muted]">
                {m.label}
                {m.source === "cv" && <span className="ml-1 text-[--color-text-faint]">(CV)</span>}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-12">
          <Block title="Problem">
            <p className="leading-relaxed text-[--color-text-muted]">{study.problem}</p>
          </Block>

          <Block title="Approach">
            <ul className="space-y-3">
              {study.approach.map((a, i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-[--color-text-muted]">
                  <span className="mt-1 font-mono text-xs text-[--color-accent]">{String(i + 1).padStart(2, "0")}</span>
                  {a}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Results & Impact">
            <ul className="space-y-3">
              {study.results.map((r, i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-[--color-text-muted]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[--color-success]" />
                  <span>
                    {r.text}
                    {r.source === "cv" && (
                      <span className="ml-1 font-mono text-xs text-[--color-text-faint]">— CV-sourced</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        </div>

        {/* Architecture sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Architecture / Pipeline
            </h3>
            <ol className="mt-4 space-y-0">
              {study.architecture.pipeline.map((step, i, arr) => (
                <li key={i} className="relative pl-6 pb-4 last:pb-0">
                  {i < arr.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-[--color-border-strong]" />
                  )}
                  <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full border border-[--color-accent] bg-[--color-bg]" />
                  <span className="text-sm text-[--color-text-muted]">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Tech Stack
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {study.architecture.stack.map((t) => (
                <span key={t} className="rounded-md border border-[--color-border] bg-[--color-bg-elevated] px-2 py-1 font-mono text-xs text-[--color-text-muted]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Links
            </h3>
            <div className="mt-3 space-y-2">
              {study.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-[--color-border] px-3 py-2 text-sm text-[--color-text-muted] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
                >
                  {l.label} <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Related repos */}
      {relatedRepos.length > 0 && (
        <div className="mt-16">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
            Related repositories
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedRepos.map((r) => (
              <a
                key={r!.name}
                href={r!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[--color-text]">{r!.name}</span>
                  <ExternalLink size={13} className="text-[--color-text-faint]" />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[--color-text-muted]">{r!.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Next */}
      <div className="mt-16 border-t border-[--color-border] pt-8">
        <Link href={`/work/${next.slug}`} className="group flex items-center justify-between gap-4">
          <span>
            <span className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Next case study
            </span>
            <span className="mt-1 block text-lg font-semibold text-[--color-text] group-hover:text-[--color-accent]">
              {next.title}
            </span>
          </span>
          <ArrowRight size={20} className="text-[--color-text-faint] transition-colors group-hover:text-[--color-accent]" />
        </Link>
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold">
        <span className="h-4 w-1 rounded-full bg-[--color-accent]" />
        {title}
      </h2>
      {children}
    </Reveal>
  );
}
