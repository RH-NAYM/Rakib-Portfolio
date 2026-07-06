"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Github, Linkedin } from "lucide-react";
import { HFIcon } from "@/components/hf-icon";
import { profile, socials } from "@/content/site";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[--color-border] bg-[--color-bg]/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight text-[--color-text]">
          <span className="text-[--color-text-faint]">[</span>
          {profile.shortName}
          <span className="text-[--color-accent]">.</span>
          <span className="text-[--color-text-faint]">]</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="relative rounded-lg px-3 py-2 text-sm text-[--color-text-muted] transition-colors hover:text-[--color-text] after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[--color-accent] after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="ml-2 flex items-center gap-1.5">
            <a
              href={socials.linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all duration-200 hover:-translate-y-0.5 hover:border-[--color-accent] hover:text-[--color-accent] active:translate-y-0 active:scale-90"
            >
              <Linkedin size={15} />
            </a>
            <a
              href={socials.huggingface.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hugging Face"
              title="Hugging Face · @rakib72642"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all duration-200 hover:-translate-y-0.5 hover:border-[--color-accent] hover:text-[--color-accent] active:translate-y-0 active:scale-90"
            >
              <HFIcon size={15} />
            </a>
            <a
              href="https://github.com/RH-NAYM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border-strong] text-[--color-text] transition-all duration-200 hover:-translate-y-0.5 hover:border-[--color-accent] hover:text-[--color-accent] active:translate-y-0 active:scale-90"
            >
              <Github size={15} />
            </a>
          </li>
        </ul>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-[--color-border] p-2 text-[--color-text] transition-transform duration-150 active:scale-90 md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[--color-border] bg-[--color-bg]/95 backdrop-blur-md md:hidden">
          <ul className="container-page flex flex-col py-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-[--color-text-muted] transition-colors hover:bg-[--color-surface] hover:text-[--color-text]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="container-page flex items-center gap-2 border-t border-[--color-border] py-3">
            <a
              href="https://github.com/RH-NAYM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Github size={15} />
            </a>
            <a
              href={socials.linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Linkedin size={15} />
            </a>
            <a
              href={socials.huggingface.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hugging Face"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <HFIcon size={15} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
