"use client";

import { useState } from "react";
import { CaseStudyCard, MoreProjectsCard } from "@/components/case-study-card";
import { Reveal } from "@/components/reveal";
import { caseStudies, repos, domains } from "@/content/projects";

/**
 * The case-study grid, shared by the homepage section and the /work page.
 * Owns which card (if any) is expanded — only one "Show more" can be open
 * at a time; opening another collapses the previous one back to its
 * original size. `items-start` on the grid keeps that resize local to the
 * expanded card instead of stretching its row-mates to match.
 */
export function WorkGrid() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const toggleExpand = (slug: string) =>
    setExpandedSlug((current) => (current === slug ? null : slug));

  return (
    <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
      {caseStudies.map((study, i) => (
        <Reveal key={study.slug} delay={(i % 3) * 80}>
          <CaseStudyCard
            study={study}
            expanded={expandedSlug === study.slug}
            onToggleExpand={toggleExpand}
          />
        </Reveal>
      ))}
      <Reveal delay={(caseStudies.length % 3) * 80}>
        <MoreProjectsCard
          moreCount={repos.length - caseStudies.length}
          totalCount={repos.length}
          domainCount={domains.length}
        />
      </Reveal>
    </div>
  );
}
