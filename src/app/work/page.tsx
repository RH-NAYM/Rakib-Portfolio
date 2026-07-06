import type { Metadata } from "next";
import { WorkGrid } from "@/components/work-grid";
import { Reveal } from "@/components/reveal";
import { repos, domains } from "@/content/projects";

export const metadata: Metadata = {
  title: "Featured Work",
  description:
    "In-depth case studies: retail-execution CV at 2M+ outlets, a real-time voice agent, a hospital appointment AI agent, agentic RAG, Bangla TTS, on-prem GPU infrastructure, Bangla OCR, and a multi-domain AI model store.",
};

export default function WorkPage() {
  return (
    <div className="container-page pt-28 pb-8">
      <Reveal>
        <p className="eyebrow">Case Studies</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Featured Work</h1>
        <p className="mt-4 max-w-2xl text-[--color-text-muted]">
          Eight deep dives chosen from {repos.length} repositories across {domains.length} AI domains — the systems with the
          richest problem-to-impact story. Each follows problem → approach → architecture → results,
          and links to the real repositories.
        </p>
      </Reveal>

      <div className="mt-12">
        <WorkGrid />
      </div>
    </div>
  );
}
