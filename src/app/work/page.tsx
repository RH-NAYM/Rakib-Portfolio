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
      <Reveal className="hero-up">
        <h1 className="wide text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">Case studies</h1>
        <p className="mt-5 max-w-[60ch] text-lg text-[--color-text-muted]">
          Eight systems chosen from {repos.length} repositories across {domains.length} AI domains. Each one covers
          the problem, the approach, the architecture and the measured result, with links to the real code.
        </p>
      </Reveal>

      <div className="mt-14">
        <WorkGrid />
      </div>
    </div>
  );
}
