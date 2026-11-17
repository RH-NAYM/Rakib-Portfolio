import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/projects-explorer";
import { repos, domains } from "@/content/projects";

export const metadata: Metadata = {
  title: "All Projects",
  description: `The full index of ${repos.length} repositories across ${domains.length} AI domains — computer vision & retail intelligence, identity, OCR, LLM/RAG/agents, speech, MLOps, backend, and OpenCV fundamentals.`,
};

export default function ProjectsPage() {
  return (
    <div className="container-page pt-28 pb-8">
      <h1 className="hero-up wide text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">All projects</h1>
      <p className="hero-up mt-5 max-w-[60ch] text-lg text-[--color-text-muted]" style={{ ["--d" as string]: "90ms" }}>
        The complete catalog of {repos.length} repositories across {domains.length} AI domains, each regenerated from code and
        git history. Filter by domain or search by name, tech, or keyword.
      </p>
      <ProjectsExplorer />
    </div>
  );
}
