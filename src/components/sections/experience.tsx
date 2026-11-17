import { ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { experience } from "@/content/site";

// Ruled rows, dates in their own column. A timeline line (as on the
// original site) runs top to bottom past every date, with a node at each
// employer. The row dividers start right of the line so they never cross it.
// Inside a row every role reads the same way: title and dates on one line,
// plain-sentence bullets, then the tools as a quiet tag row.
export function Experience() {
  return (
    <section id="experience" className="container-page scroll-mt-24 py-20">
      <SectionHeading title="Experience" />
      <div className="relative">
        {/* the timeline: draws downward when the section scrolls in */}
        <span
          data-m="grow"
          aria-hidden
          className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-[--color-accent]/60 via-[--color-border-strong] to-transparent md:left-[9px]"
        />
        <ol data-m-group>
          {experience.map((job, idx) => (
            <li key={job.org} data-m="up" className="relative pl-8 md:pl-12">
              <div
                className={`grid gap-5 md:grid-cols-12 md:gap-8 ${
                  idx === 0 ? "pb-10" : "border-t border-[--color-border] py-10"
                } ${idx === experience.length - 1 ? "border-b border-[--color-border]" : ""}`}
              >
                {/* dates column */}
                <div className="relative md:col-span-3">
                  <span
                    aria-hidden
                    className="absolute -left-8 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[--color-accent] bg-[--color-bg] md:-left-12 md:top-0 md:h-5 md:w-5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[--color-accent] md:h-2 md:w-2" />
                  </span>
                  <p className="text-sm font-semibold text-[--color-accent]">{job.period}</p>
                  <p className="mt-1 text-sm text-[--color-text-muted]">{job.duration}</p>
                  <p className="mt-1 text-sm text-[--color-text-faint]">{job.location}</p>
                </div>

                {/* company + roles */}
                <div className="md:col-span-9">
                  <h3 className="wide text-xl font-extrabold leading-tight tracking-tight text-[--color-text] sm:text-2xl">
                    {job.org}
                  </h3>
                  {job.link && (
                    <a
                      href={job.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-[--color-text-muted] underline decoration-[--color-border-strong] underline-offset-4 transition-colors hover:text-[--color-text]"
                    >
                      {job.link.label} <ExternalLink size={12} />
                    </a>
                  )}

                  <div className="mt-6 space-y-8">
                    {job.roles.map((role) => (
                      <div key={role.title + role.period} className="max-w-[68ch]">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                          <h4 className="font-bold text-[--color-text]">{role.title}</h4>
                          <span className="shrink-0 text-sm text-[--color-text-faint]">{role.period}</span>
                        </div>

                        <ul className="mt-3 space-y-2.5">
                          {role.bullets.map((b, k) => (
                            <li
                              key={k}
                              className="relative pl-5 text-[0.9375rem] leading-relaxed text-[--color-text-muted]"
                            >
                              <span
                                aria-hidden
                                className="absolute left-0 top-[0.72em] h-1 w-1 rounded-full bg-[--color-accent]"
                              />
                              {b}
                            </li>
                          ))}
                        </ul>

                        {role.stack && (
                          <ul aria-label="Tools" className="mt-4 flex flex-wrap gap-1.5">
                            {role.stack.map((t) => (
                              <li
                                key={t}
                                className="rounded-[3px] bg-[--color-surface] px-2 py-0.5 text-xs text-[--color-text-muted]"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
