import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { CaseStudyCard } from "@/components/case-study-card";
import { caseStudies, repos, domains } from "@/content/projects";

export function FeaturedWork() {
  return (
    <section id="work" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        index="03"
        title="Featured Work"
        kicker={`Six deep case studies — the strongest of ${repos.length} repositories across ${domains.length} AI domains. Each follows problem → approach → architecture → results.`}
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study, i) => (
          <Reveal key={study.slug} delay={(i % 3) * 80}>
            <CaseStudyCard study={study} />
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-[--color-border-strong] px-5 py-3 text-sm font-medium text-[--color-text] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
        >
          Browse all {repos.length} projects <ArrowRight size={16} />
        </Link>
      </Reveal>
    </section>
  );
}
