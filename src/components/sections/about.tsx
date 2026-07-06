import { Eye, Sparkles, Server } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ProfileShuffle } from "@/components/profile-shuffle";
import {
  about,
  aboutPillars,
  education,
  languages,
  recognition,
  profile,
  profileImages,
} from "@/content/site";

const pillarIcons = { cv: Eye, genai: Sparkles, infra: Server } as const;

export function About() {
  return (
    <section id="about" className="container-page scroll-mt-24 py-20">
      <SectionHeading index="01" title="About" />
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
        <Reveal className="space-y-5 text-[--color-text-muted]">
          {about.map((paragraph, i) => (
            <p key={i} className="leading-relaxed">
              {paragraph}
            </p>
          ))}

          <div className="!mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {aboutPillars.map((pillar, i) => {
              const Icon = pillarIcons[pillar.key];
              return (
                <Reveal key={pillar.key} delay={150 + i * 80}>
                  <div className="card h-full p-4 transition-transform duration-300 hover:-translate-y-1">
                    <Icon size={18} className="text-[--color-accent]" />
                    <p className="mt-2.5 text-sm font-semibold text-[--color-text]">{pillar.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[--color-text-faint]">{pillar.note}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="group card overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1">
            <div className="relative aspect-[4/4.6] w-full overflow-hidden">
              <ProfileShuffle images={[...profileImages]} alt={`${profile.name}, ${profile.title}`} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[--color-bg] to-transparent p-4">
                <p className="font-mono text-xs text-[--color-accent]">{profile.location}</p>
                <p className="text-sm font-medium text-[--color-text]">{profile.company}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Credentials strip — full width so short cards never dangle beside a tall column */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Reveal delay={120}>
          <div className="card h-full p-5 transition-transform duration-300 hover:-translate-y-1">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Education
            </h3>
            <p className="mt-3 font-medium text-[--color-text]">{education.degree}</p>
            <p className="text-sm text-[--color-text-muted]">{education.institution}</p>
            <p className="mt-1 font-mono text-xs text-[--color-accent]">
              {education.year} &middot; {education.cgpa}
            </p>
          </div>
        </Reveal>

        <Reveal delay={190}>
          <div className="card h-full p-5 transition-transform duration-300 hover:-translate-y-1">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[--color-text-faint]">
              Recognition
            </h3>
            <ul className="mt-3 space-y-2.5">
              {recognition.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-[--color-text-muted]">
                  <span className="mt-1 text-[--color-accent]">&rsaquo;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <div className="card h-full p-5 transition-transform duration-300 hover:-translate-y-1">
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
