import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { skillGroups } from "@/content/site";

export function Skills() {
  return (
    <section id="skills" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        index="02"
        title="Skills & Stack"
        kicker="Grouped by what I actually ship — each cluster is backed by real, in-production projects, not self-rated percentages."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, i) => (
          <Reveal key={group.title} delay={(i % 3) * 80}>
            <div className="card h-full p-6 transition-transform duration-300 hover:-translate-y-1">
              <h3 className="text-base font-semibold text-[--color-text]">{group.title}</h3>
              <p className="mt-1 text-xs text-[--color-text-faint]">{group.note}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-[--color-border] bg-[--color-bg-elevated] px-2.5 py-1 font-mono text-xs text-[--color-text-muted] transition-colors duration-200 hover:border-[--color-accent] hover:text-[--color-text]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
