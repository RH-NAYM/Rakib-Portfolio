import { ExternalLink } from "lucide-react";
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
            <Reveal key={job.org} delay={i * 60}>
              <div className="relative pl-8 md:pl-12">
                <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[--color-accent] bg-[--color-bg]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[--color-accent]" />
                </span>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="text-lg font-semibold text-[--color-text]">{job.org}</h3>
                  <span className="font-mono text-xs text-[--color-accent]">{job.totalPeriod}</span>
                </div>
                <p className="text-sm text-[--color-text-muted]">{job.location}</p>

                {job.link && (
                  <a
                    href={job.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-[--color-accent] transition-colors hover:text-[--color-accent-strong]"
                  >
                    {job.link.label} <ExternalLink size={11} />
                  </a>
                )}

                <div
                  className={
                    job.roles.length > 1
                      ? "mt-4 space-y-5 border-l border-[--color-border] pl-5"
                      : "mt-3"
                  }
                >
                  {job.roles.map((role, j) => (
                    <div key={role.title + role.period}>
                      {job.roles.length > 1 && (
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                          <h4 className="text-sm font-semibold text-[--color-text]">{role.title}</h4>
                          <span className="font-mono text-[11px] text-[--color-text-faint]">{role.period}</span>
                        </div>
                      )}
                      <ul className={job.roles.length > 1 ? "mt-2 space-y-2" : "mt-3 space-y-2"}>
                        {role.bullets.map((b, k) => (
                          <li key={k} className="flex gap-2 text-sm leading-relaxed text-[--color-text-muted]">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[--color-text-faint]" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
