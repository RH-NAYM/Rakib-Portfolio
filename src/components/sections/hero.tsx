import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { ProfileShuffle } from "@/components/profile-shuffle";
import { SiteBackground } from "@/components/site-background";
import { CountUp } from "@/components/count-up";
import { profile, metrics, profileImages } from "@/content/site";

// Load sequence: the name rises line by line, the copy and portrait fade up,
// the stats count. The particle constellation from the original design
// moves behind it, and the portrait cross-fades through photos on a loop.
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-20">
      {/* moving particle constellation + soft glow, fades out before About */}
      <SiteBackground />

      <div className="container-page relative">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="hero-up flex items-center gap-2 text-sm text-[--color-text-muted]">
              <span className="h-2 w-2 rounded-full bg-[--color-accent]" />
              {profile.availability}
            </p>

            <h1 className="wide mt-6 text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.02em] sm:text-7xl lg:text-[4.6rem] xl:text-[5.1rem]">
              <span className="line-mask">
                <span className="line-rise whitespace-nowrap" style={{ ["--d" as string]: "80ms" }}>
                  MD Rakibul
                </span>
              </span>
              <span className="line-mask">
                <span className="line-rise whitespace-nowrap" style={{ ["--d" as string]: "170ms" }}>
                  Hasan Naym
                </span>
              </span>
            </h1>

            <p className="hero-up mt-6 text-xl font-semibold text-[--color-text] sm:text-2xl" style={{ ["--d" as string]: "320ms" }}>
              Applied AI engineer and AI team lead at HawkEyes, Dhaka.
            </p>
            <p className="hero-up mt-4 max-w-[58ch] text-[--color-text-muted] sm:text-lg" style={{ ["--d" as string]: "400ms" }}>
              {profile.positioning}
            </p>

            <div className="hero-up mt-9 flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "500ms" }}>
              <Link
                href="/work"
                className="press inline-flex items-center gap-2 rounded-md bg-[--color-accent] px-5 py-3 text-sm font-bold text-[--color-bg] hover:bg-[--color-accent-strong]"
              >
                See the case studies <ArrowUpRight size={16} className="nudge" />
              </Link>
              <Link
                href="/#services"
                className="inline-flex items-center gap-2 rounded-md border border-[--color-border-strong] px-5 py-3 text-sm font-bold text-[--color-text] press hover:border-[--color-text-muted]"
              >
                Hire me
              </Link>
              <a
                href="/Rakibul_Hasan_Naym_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-3 text-sm font-semibold text-[--color-text-muted] transition-colors hover:text-[--color-text]"
              >
                <Download size={15} /> Download CV
              </a>
            </div>
          </div>

          {/* portrait: cross-fades through the photos on a loop */}
          <div className="hero-up mx-auto w-full max-w-[22rem] lg:col-span-4 lg:col-start-9 lg:max-w-none" style={{ ["--d" as string]: "200ms" }}>
            <div className="group card overflow-hidden p-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <ProfileShuffle images={[...profileImages]} alt={`${profile.name}, ${profile.title}`} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[--color-bg] to-transparent p-4 pt-16">
                  <p className="text-xs font-semibold text-[--color-accent]">{profile.location}</p>
                  <p className="text-sm font-medium text-[--color-text]">{profile.company}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <dl data-hero-stats className="hero-up mt-16 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[--color-border] pt-8 sm:grid-cols-3 lg:grid-cols-5" style={{ ["--d" as string]: "650ms" }}>
          {metrics.map((m, i) => (
            <div key={m.label}>
              <dt className="wide text-3xl font-extrabold tracking-tight text-[--color-text]">
                <CountUp value={m.value} delay={i * 70} />
              </dt>
              <dd className="mt-1 text-sm text-[--color-text-muted]">{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
