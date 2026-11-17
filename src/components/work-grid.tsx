import { CaseStudyCard, MoreProjectsLink } from "@/components/case-study-card";
import { caseStudies, repos, domains } from "@/content/projects";

/**
 * The case-study grid, shared by the homepage section and the /work page.
 * The first study (the national-scale retail CV platform) takes a double
 * column; the other seven fill the remaining slots of a 3-column grid.
 */
export function WorkGrid() {
  const [first, ...rest] = caseStudies;
  return (
    <>
      <div data-m-group className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <CaseStudyCard study={first} featured />
        </div>
        {rest.map((study) => (
          <CaseStudyCard key={study.slug} study={study} />
        ))}
      </div>
      <MoreProjectsLink
        moreCount={repos.length - caseStudies.length}
        totalCount={repos.length}
        domainCount={domains.length}
      />
    </>
  );
}
