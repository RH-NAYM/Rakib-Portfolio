import { SectionHeading } from "@/components/section-heading";
import { WorkGrid } from "@/components/work-grid";
import { repos } from "@/content/projects";

export function FeaturedWork() {
  return (
    <section id="work" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        title="Selected work"
        kicker={`Eight case studies picked from ${repos.length} repositories. Each one walks through the problem, the approach, the architecture and the measured result.`}
      />
      <WorkGrid />
    </section>
  );
}
