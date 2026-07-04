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
      <p className="eyebrow">Repository Index</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">All Projects</h1>
      <p className="mt-4 max-w-2xl text-[--color-text-muted]">
        The complete catalog of {repos.length} repositories across {domains.length} AI domains, each regenerated from code and
        git history. Filter by domain or search by name, tech, or keyword.
      </p>
      <ProjectsExplorer />
    </div>
  );
}
