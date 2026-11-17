import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { CaseStudy } from "@/content/projects";
import { DetectTag } from "@/components/detect-tag";
import { domainStyle } from "@/content/domain-colors";

// Open layout (no boxed card): cover, class label, title, one line of
// context, two headline metrics. Hover draws a box around the cover in the
// study's domain color, so the interaction speaks the same visual language
// as the detection overlays in the work itself.
export function CaseStudyCard({ study, featured = false }: { study: CaseStudy; featured?: boolean }) {
  const { color, short } = domainStyle(study.domain);
  return (
    <article data-m="card" className="group relative flex h-full flex-col">
      <div
        className="relative aspect-video overflow-hidden rounded-[3px] bg-[--color-surface] outline outline-2 outline-offset-4 outline-transparent transition-[outline-color] duration-200 group-hover:outline-[var(--dc)] group-focus-within:outline-[var(--dc)]"
        style={{ ["--dc" as string]: color }}
      >
        {study.cover && (
          <Image
            src={study.cover}
            alt=""
            fill
            sizes={featured ? "(min-width: 1024px) 760px, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"}
            className="zoom-media object-cover"
          />
        )}
        <DetectTag label={short} color={color} className="absolute left-0 top-0 rounded-none rounded-br-[3px] px-2 py-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
      </div>

      <h3
        className={`mt-5 font-extrabold leading-tight tracking-tight text-[--color-text] ${
          featured ? "wide text-2xl sm:text-3xl" : "text-xl"
        }`}
      >
        <Link href={`/work/${study.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          {study.title}
        </Link>
      </h3>
      <p className={`mt-2 text-[--color-text-muted] ${featured ? "max-w-[60ch]" : "line-clamp-3 text-[0.9375rem]"}`}>
        {study.subtitle}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {study.metrics.slice(0, featured ? 3 : 2).map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <dt className="font-bold text-[--color-text]">{m.value}</dt>
            <dd className="text-[--color-text-faint]">{m.label}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

// Closing link under the grid, pointing to the full repository index.
export function MoreProjectsLink({ moreCount, totalCount, domainCount }: {
  moreCount: number;
  totalCount: number;
  domainCount: number;
}) {
  return (
    <Link
      href="/projects"
      data-m="up" className="group mt-14 flex flex-col gap-2 border-y border-[--color-border] py-6 transition-colors hover:border-[--color-border-strong] sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="text-[--color-text-muted]">
        <span className="font-bold text-[--color-text]">{moreCount} more projects</span> across {domainCount} AI
        domains, with search and filters.
      </span>
      <span className="inline-flex items-center gap-2 font-bold text-[--color-accent]">
        Browse all {totalCount}
        <ArrowRight size={16} className="nudge-x" />
      </span>
    </Link>
  );
}
