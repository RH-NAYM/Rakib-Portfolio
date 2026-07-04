"use client";

import { useEffect } from "react";

/**
 * Ensures a URL like `/#contact` (a hard navigation / full page load, not a
 * client-side <Link> click) actually scrolls to the target section.
 *
 * Why this is needed: on first paint the browser tries to scroll to the
 * element matching `location.hash` exactly once. If that element's final
 * position hasn't settled yet (web fonts swapping in, images/next/font
 * loading, client components hydrating) the native scroll fires too early
 * and the page is left at the top. Client-side <Link> navigation doesn't hit
 * this because Next.js re-applies its own scroll-to-hash logic on route
 * changes — only the "cold" full-page-load path was missing this handling.
 *
 * Fix: on mount, resolve the current hash to an element and scrollIntoView
 * it, then retry a couple more times as layout settles (fonts/images load,
 * Reveal-animated content mounts). scroll-margin-top (scroll-mt-24 on each
 * section) keeps the fixed header from covering the heading.
 */
export function HashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;

      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        target = document.getElementById(hash.slice(1));
      }
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Try immediately, then again on the next couple of frames/timeouts to
    // cover late layout shifts from fonts, images, and hydration.
    scrollToHash();
    const raf = requestAnimationFrame(scrollToHash);
    const t1 = setTimeout(scrollToHash, 150);
    const t2 = setTimeout(scrollToHash, 500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // Only needs to run once on initial mount/load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
