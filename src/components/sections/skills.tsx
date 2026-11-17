import { SectionHeading } from "@/components/section-heading";
import { skillGroups } from "@/content/site";

// A ruled list rather than a grid of cards: each row is one cluster, its
// note on the left, the tools it covers on the right.
export function Skills() {
  return (
    <section id="skills" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        title="Skills and stack"
        kicker="Grouped by what I ship. Every cluster here is backed by projects running in production, not self-rated percentages."
      />
      <ul className="divide-y divide-[--color-border] border-b border-[--color-border]">
        {skillGroups.map((group) => (
          <li key={group.title} data-m="up" className="grid gap-3 py-6 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <h3 className="font-bold text-[--color-text]">{group.title}</h3>
              <p className="mt-1 text-sm text-[--color-text-faint]">{group.note}</p>
            </div>
            <ul data-m-group className="flex flex-wrap gap-x-2 gap-y-2 md:col-span-8 md:pt-0.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  data-m="left"
                  className="rounded-[3px] bg-[--color-surface] px-2.5 py-1 text-sm text-[--color-text-muted] transition-colors duration-200 hover:bg-[--color-surface-2] hover:text-[--color-text]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
