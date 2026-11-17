import { SectionHeading } from "@/components/section-heading";
import { about, aboutPillars, education, languages, recognition } from "@/content/site";

const pillarColor = { cv: "var(--c-cv)", genai: "var(--c-llm)", infra: "var(--c-infra)" } as const;

export function About() {
  return (
    <section id="about" className="container-page scroll-mt-24 py-20">
      <SectionHeading title="About" />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div data-m-group className="space-y-5 text-[--color-text-muted]">
            {about.map((paragraph, i) => (
              <p key={i} data-m="up" className={`max-w-[66ch] ${i === 0 ? "text-lg text-[--color-text]" : ""}`}>
                {paragraph}
              </p>
            ))}
          </div>

          <ul data-m-group className="mt-10 grid gap-6 sm:grid-cols-3">
            {aboutPillars.map((pillar) => (
              <li key={pillar.key} data-m="up" className="relative pl-4">
                <span
                  data-m="grow"
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ backgroundColor: pillarColor[pillar.key] }}
                />
                <p className="font-bold text-[--color-text]">{pillar.label}</p>
                <p className="mt-1 text-sm text-[--color-text-muted]">{pillar.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <dl data-m-group className="divide-y divide-[--color-border] border-y border-[--color-border] lg:col-span-4 lg:col-start-9 lg:self-start">
          <div data-m="up" className="py-5">
            <dt className="text-sm text-[--color-text-faint]">Education</dt>
            <dd className="mt-1.5">
              <p className="font-semibold text-[--color-text]">{education.degree}</p>
              <p className="text-sm text-[--color-text-muted]">
                {education.institution}, {education.year}, {education.cgpa}
              </p>
            </dd>
          </div>
          <div data-m="up" className="py-5">
            <dt className="text-sm text-[--color-text-faint]">Recognition</dt>
            <dd className="mt-1.5">
              <ul className="space-y-2.5">
                {recognition.map((item, i) => (
                  <li key={i} className="text-sm text-[--color-text-muted]">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div data-m="up" className="py-5">
            <dt className="text-sm text-[--color-text-faint]">Languages</dt>
            <dd className="mt-1.5 text-sm text-[--color-text-muted]">{languages}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
