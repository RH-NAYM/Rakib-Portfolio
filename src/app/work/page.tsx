import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CaseStudyCard } from "@/components/case-study-card";
import { Reveal } from "@/components/reveal";
import { caseStudies, repos, domains } from "@/content/projects";

export const metadata: Metadata = {
  title: "Featured Work",
  description:
    "In-depth case studies: retail-execution CV at 2M+ outlets, a real-time voice agent, agentic RAG, Bangla TTS, on-prem GPU infrastructure, and Bangla OCR.",
};

export default function WorkPage() {
  return (
    <div className="container-page pt-28 pb-8">
      <Reveal>
        <p className="eyebrow">Case Studies</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Featured Work</h1>
        <p className="mt-4 max-w-2xl text-[--color-text-muted]">
          Six deep dives chosen from {repos.length} repositories across {domains.length} AI domains — the systems with the
          richest problem-to-impact story. Each follows problem → approach → architecture → results,
          and links to the real repositories.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          See the full {repos.length}-repository index <ArrowRight size={16} />
        </Link>
      </Reveal>
    </div>
  );
}
