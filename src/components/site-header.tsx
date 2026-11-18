"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Github, Linkedin } from "lucide-react";
import { HFIcon } from "@/components/hf-icon";
import { socials } from "@/content/site";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Writing" },
  { href: "/#services", label: "Hire me" },
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
          ? "border-b border-[--color-border] bg-[--color-bg]/90 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="group wide inline-flex items-center gap-2 text-[0.95rem] font-extrabold tracking-tight text-[--color-text]">
          <span aria-hidden className="h-3.5 w-3.5 rounded-[2px] border-2 border-[--color-accent] transition-transform duration-300 group-hover:rotate-90" />
          Rakibul Hasan
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="underline-draw rounded-md px-3 py-2 text-sm font-medium text-[--color-text-muted] transition-colors hover:text-[--color-text]"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] press hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Linkedin size={15} />
            </a>
            <a
              href={socials.huggingface.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hugging Face"
              title="Hugging Face · @rakib72642"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] press hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <HFIcon size={15} />
            </a>
            <a
              href="https://github.com/RH-NAYM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border-strong] text-[--color-text] press hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Github size={15} />
            </a>
          </li>
        </ul>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-[--color-border] p-2 text-[--color-text] transition-transform duration-150 active:scale-90 md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="deal-in border-t border-[--color-border] bg-[--color-bg]/95 backdrop-blur-md md:hidden">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Github size={15} />
            </a>
            <a
              href={socials.linkedin.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Linkedin size={15} />
            </a>
            <a
              href={socials.huggingface.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hugging Face"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--color-border] text-[--color-text-muted] transition-all duration-200 active:scale-90 hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <HFIcon size={15} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
