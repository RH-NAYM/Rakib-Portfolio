"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, Star } from "lucide-react";
import { repos, domains } from "@/content/projects";
import { domainStyle } from "@/content/domain-colors";

export function ProjectsExplorer() {
  const [domain, setDomain] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      const inDomain = domain === "All" || r.domain === domain;
      const inQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return inDomain && inQuery;
    });
  }, [domain, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of repos) map[r.domain] = (map[r.domain] || 0) + 1;
    return map;
  }, []);

  return (
    <div className="mt-10">
      <div className="mb-6 flex flex-col gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-faint]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${repos.length} repos by name, tech, or keyword…`}
            className="w-full rounded-lg border border-[--color-border] bg-[--color-bg-elevated] py-2.5 pl-10 pr-3 text-sm text-[--color-text] outline-none placeholder:text-[--color-text-faint] focus:border-[--color-accent]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={domain === "All"} onClick={() => setDomain("All")}>
            All <span className="text-[--color-text-faint]">{repos.length}</span>
          </Chip>
          {domains.map((d) => (
            <Chip key={d} active={domain === d} onClick={() => setDomain(d)}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: domainStyle(d).color }} />
              {d} <span className="text-[--color-text-faint]">{counts[d]}</span>
            </Chip>
          ))}
        </div>
      </div>

      <p className="mb-4 font-mono text-xs text-[--color-text-faint]">
        {filtered.length} {filtered.length === 1 ? "repository" : "repositories"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r, i) => (
          <div
            key={`${domain}:${r.name}`}
            className="deal-in group card flex flex-col border-l-2 p-4 transition-transform duration-300 hover:-translate-y-0.5"
            style={{ borderLeftColor: domainStyle(r.domain).color, animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[--color-text] hover:text-[--color-accent]"
              >
                {r.name}
              </a>
              <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.name}`}>
                <ExternalLink size={14} className="nudge text-[--color-text-faint] group-hover:text-[--color-accent]" />
              </a>
            </div>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[--color-text-muted]">
              {r.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {r.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded-[3px] bg-[--color-surface-2] px-1.5 py-0.5 text-[11px] text-[--color-text-muted]">
                  {t}
                </span>
              ))}
              {r.caseStudy && (
                <Link
                  href={`/work/${r.caseStudy}`}
                  className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-[--color-accent]"
                >
                  <Star size={10} /> case study
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-[--color-text-muted]">No repositories match your filters.</p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`press rounded-md border px-3 py-1.5 text-sm ${
        active
          ? "border-[--color-text-muted] bg-[--color-surface-2] text-[--color-text]"
          : "border-[--color-border] text-[--color-text-muted] hover:border-[--color-border-strong] hover:text-[--color-text]"
      }`}
    >
      {children}
    </button>
  );
}
