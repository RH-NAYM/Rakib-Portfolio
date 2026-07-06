import { SectionHeading } from "@/components/section-heading";
import { WorkGrid } from "@/components/work-grid";
import { repos, domains } from "@/content/projects";

export function FeaturedWork() {
  return (
    <section id="work" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        index="03"
        title="Featured Work"
        kicker={`Eight deep case studies — the strongest of ${repos.length} repositories across ${domains.length} AI domains. Each follows problem → approach → architecture → results.`}
      />
      <WorkGrid />
    </section>
  );
}
