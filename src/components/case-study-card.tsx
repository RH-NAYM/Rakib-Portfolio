import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CaseStudy } from "@/content/projects";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Link href={`/work/${study.slug}`} className="group block">
      <article className="card h-full p-6 group-hover:-translate-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{study.domain}</span>
          <ArrowUpRight
            size={18}
            className="text-[--color-text-faint] transition-colors group-hover:text-[--color-accent]"
          />
        </div>

        <h3 className="mt-3 text-xl font-semibold tracking-tight text-[--color-text]">
          {study.title}
        </h3>
        <p className="mt-1 text-xs text-[--color-text-faint]">{study.context}</p>
        <p className="mt-3 text-sm leading-relaxed text-[--color-text-muted]">{study.subtitle}</p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {study.metrics.slice(0, 3).map((m) => (
            <div key={m.label}>
              <span className="font-mono text-lg font-semibold text-[--color-accent]">{m.value}</span>
              <span className="ml-1.5 text-xs text-[--color-text-faint]">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {study.tags.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-md border border-[--color-border] px-2 py-0.5 font-mono text-[11px] text-[--color-text-muted]"
            >
              {t}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
}
