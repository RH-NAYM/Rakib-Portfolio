import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { services, socials } from "@/content/site";

export function Services() {
  return (
    <section id="services" className="container-page scroll-mt-24 py-20">
      <SectionHeading
        title="Hire me"
        kicker="The same production stack, packaged as fixed-scope freelance work. Order on Fiverr or Upwork, or send me a message for a custom quote."
      />

      <ul data-m-group className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <li key={s.title} data-m="card" className="group flex flex-col">
            <div className="relative aspect-[1328/800] overflow-hidden rounded-[3px] bg-[--color-surface]">
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                className="zoom-media object-cover"
              />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-extrabold leading-tight text-[--color-text]">{s.title}</h3>
              <p className="shrink-0 text-sm text-[--color-text-faint]">
                from <span className="text-base font-bold text-[--color-accent]">{s.from}</span>
              </p>
            </div>
            <p className="mt-2 text-[0.9375rem] text-[--color-text-muted]">{s.blurb}</p>
          </li>
        ))}
      </ul>

      <div data-m="up" className="mt-14 flex flex-col gap-3 border-t border-[--color-border] pt-8 sm:flex-row sm:items-center">
        <a
          href={socials.fiverr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[--color-accent] px-5 py-3 text-sm font-bold text-[--color-bg] press hover:bg-[--color-accent-strong]"
        >
          Order on Fiverr <ArrowUpRight size={16} className="nudge" />
        </a>
        <a
          href={socials.upwork.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[--color-border-strong] px-5 py-3 text-sm font-bold text-[--color-text] press hover:border-[--color-text-muted]"
        >
          Hire on Upwork <ArrowUpRight size={16} className="nudge" />
        </a>
        <Link
          href="/#contact"
          className="px-2 py-3 text-sm font-semibold text-[--color-text-muted] underline decoration-[--color-border-strong] underline-offset-4 transition-colors hover:text-[--color-text]"
        >
          Need something custom? Send a message
        </Link>
      </div>
    </section>
  );
}
