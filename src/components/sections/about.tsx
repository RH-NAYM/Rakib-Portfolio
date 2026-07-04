import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { about, education, languages, recognition, profile } from "@/content/site";

export function About() {
  return (
    <section id="about" className="container-page scroll-mt-24 py-20">
      <SectionHeading index="01" title="About" />
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-5 text-[--color-text-muted]">
          {about.map((paragraph, i) => (
            <p key={i} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal delay={100} className="space-y-6">
          <div className="card overflow-hidden p-0">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src="/profile.webp"
                alt={`${profile.name}, ${profile.title}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 340px"
                className="object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[--color-bg] to-transparent p-4">
                <p className="font-mono text-xs text-[--color-accent]">{profile.location}</p>
                <p className="text-sm font-medium text-[--color-text]">{profile.company}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Education
            </h3>
            <p className="mt-3 font-medium text-[--color-text]">{education.degree}</p>
            <p className="text-sm text-[--color-text-muted]">{education.institution}</p>
            <p className="mt-1 font-mono text-xs text-[--color-accent]">
              {education.year} &middot; {education.cgpa}
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Recognition
            </h3>
            <ul className="mt-3 space-y-3">
              {recognition.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[--color-text-muted]">
                  <span className="mt-1 text-[--color-accent]">&rsaquo;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Languages
            </h3>
            <p className="mt-3 text-sm text-[--color-text-muted]">{languages}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
