"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide entrance system. Elements opt in with `data-m="<kind>"`
 * (up | card | left | pop | line | grow | photo); stagger is counted inside
 * the nearest `[data-m-group]`.
 *
 * Progressive by design: the server HTML is the finished page. Only elements
 * that start below the fold get armed (hidden), so nothing already on screen
 * ever blinks, and with no JS or with reduced motion everything is simply
 * there. Each element plays once when it scrolls in, then its motion
 * attributes are cleared so hover transitions are not delayed.
 */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    let io: IntersectionObserver | null = null;

    const raf = requestAnimationFrame(() => {
      const fold = window.innerHeight * 0.92;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-m]")).filter(
        (el) => !el.hasAttribute("data-m-done") && el.getBoundingClientRect().top > fold
      );

      // stagger index per group, in DOM order, capped so long lists stay fast
      const counts = new Map<Element, number>();
      for (const el of els) {
        const group = el.closest("[data-m-group]") ?? el.parentElement ?? document.body;
        const i = counts.get(group) ?? 0;
        counts.set(group, i + 1);
        el.style.setProperty("--i", String(Math.min(i, 8)));
        el.setAttribute("data-m-armed", "");
      }

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            io?.unobserve(el);
            el.setAttribute("data-m-in", "");
            el.removeAttribute("data-m-armed");
            const i = Number(el.style.getPropertyValue("--i") || 0);
            timers.push(
              window.setTimeout(() => {
                el.removeAttribute("data-m-in");
                el.style.removeProperty("--i");
                el.setAttribute("data-m-done", "");
              }, 760 + i * 60)
            );
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
      );
      els.forEach((el) => io!.observe(el));
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      timers.forEach(clearTimeout);
      // never leave anything hidden if the page changes mid-intro
      document.querySelectorAll("[data-m-armed]").forEach((el) => el.removeAttribute("data-m-armed"));
    };
  }, [pathname]);

  return null;
}
