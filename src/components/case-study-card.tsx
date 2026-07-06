import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import type { CaseStudy } from "@/content/projects";

// Every variable-length block below (title, subtitle, metrics, tags) is
// pinned to a fixed height + line-clamp/overflow-hidden when collapsed, so
// the grid stays visually uniform. "Show more" (controlled by the parent —
// see work-grid.tsx) lifts those caps for exactly one card at a time and
// reveals the full text; the Link stays a real <a> (separate from the
// show-more button, not nested inside it) so navigation, right-click, and
// ctrl/cmd-click still behave like a normal link.
export function CaseStudyCard({
  study,
  expanded = false,
  onToggleExpand,
}: {
  study: CaseStudy;
  expanded?: boolean;
  onToggleExpand?: (slug: string) => void;
}) {
  return (
    <article className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1">
      <Link href={`/work/${study.slug}`} className="flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow truncate">{study.domain}</span>
          <ArrowUpRight
            size={18}
            className="shrink-0 text-[--color-text-faint] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[--color-accent]"
          />
        </div>

        <h3
          className={`mt-3 text-xl font-semibold leading-snug tracking-tight text-[--color-text] ${
            expanded ? "" : "h-14 overflow-hidden line-clamp-2"
          }`}
        >
          {study.title}
        </h3>
        <p className="mt-1 truncate text-xs text-[--color-text-faint]">{study.context}</p>
        <p
          className={`mt-3 text-sm leading-relaxed text-[--color-text-muted] ${
            expanded ? "" : "h-[4.5rem] overflow-hidden line-clamp-3"
          }`}
        >
          {study.subtitle}
        </p>

        <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 ${expanded ? "" : "h-11 overflow-hidden"}`}>
          {(expanded ? study.metrics : study.metrics.slice(0, 3)).map((m) => (
            <div key={m.label}>
              <span className="font-mono text-lg font-semibold text-[--color-accent]">{m.value}</span>
              <span className="ml-1.5 text-xs text-[--color-text-faint]">{m.label}</span>
            </div>
          ))}
        </div>

        <div className={`mt-5 flex flex-wrap gap-1.5 ${expanded ? "" : "h-9 overflow-hidden"}`}>
          {(expanded ? study.tags : study.tags.slice(0, 5)).map((t) => (
            <span
              key={t}
              className="rounded-md border border-[--color-border] px-2 py-0.5 font-mono text-[11px] text-[--color-text-muted] transition-colors duration-200 group-hover:border-[--color-border-strong]"
            >
              {t}
            </span>
          ))}
        </div>
      </Link>

      {onToggleExpand && (
        <button
          type="button"
          onClick={() => onToggleExpand(study.slug)}
          aria-expanded={expanded}
          className="relative z-10 mt-4 inline-flex w-fit items-center gap-1 self-start font-mono text-xs text-[--color-text-faint] transition-colors hover:text-[--color-accent]"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            size={13}
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </article>
  );
}

// Ninth grid tile (same fixed card shape as CaseStudyCard) so the 8 featured
// case studies complete a clean 3×3 grid instead of dangling a half-empty
// last row, and doubles as the "see more" affordance inside the grid itself.
export function MoreProjectsCard({ moreCount, totalCount, domainCount }: {
  moreCount: number;
  totalCount: number;
  domainCount: number;
}) {
  return (
    <Link href="/projects" className="group block h-full">
      <article className="card flex h-full flex-col items-center justify-center gap-2 p-6 text-center transition-all duration-300 group-hover:-translate-y-1">
        <span className="font-mono text-3xl font-semibold text-[--color-accent]">+{moreCount}</span>
        <p className="max-w-[16rem] text-sm text-[--color-text-muted]">
          more projects across {domainCount} AI domains
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text] transition-transform duration-300 group-hover:translate-x-1">
          Browse all {totalCount} <ArrowRight size={14} />
        </span>
      </article>
    </Link>
  );
}
