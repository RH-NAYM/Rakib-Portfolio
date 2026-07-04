import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { experience } from "@/content/site";

export function Experience() {
  return (
    <section id="experience" className="container-page scroll-mt-24 py-20">
      <SectionHeading index="04" title="Experience" />
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[--color-accent]/60 via-[--color-border-strong] to-transparent md:left-[9px]" />
        <div className="space-y-10">
          {experience.map((job, i) => (
            <Reveal key={job.org + job.period} delay={i * 60}>
              <div className="relative pl-8 md:pl-12">
                <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[--color-accent] bg-[--color-bg]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[--color-accent]" />
                </span>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="text-lg font-semibold text-[--color-text]">{job.role}</h3>
                  <span className="font-mono text-xs text-[--color-accent]">{job.period}</span>
                </div>
                <p className="text-sm text-[--color-text-muted]">
                  {job.org} · {job.location}
                </p>
                <ul className="mt-3 space-y-2">
                  {job.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-sm leading-relaxed text-[--color-text-muted]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[--color-text-faint]" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
