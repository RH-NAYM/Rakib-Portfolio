"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Github } from "lucide-react";
import { profile } from "@/content/site";

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
                className="rounded-lg px-3 py-2 text-sm text-[--color-text-muted] transition-colors hover:text-[--color-text]"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href="https://github.com/RH-NAYM"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-[--color-border-strong] px-3 py-2 text-sm text-[--color-text] transition-colors hover:border-[--color-accent] hover:text-[--color-accent]"
            >
              <Github size={15} /> GitHub
            </a>
          </li>
        </ul>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-[--color-border] p-2 text-[--color-text] md:hidden"
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
        </div>
      )}
    </header>
  );
}
