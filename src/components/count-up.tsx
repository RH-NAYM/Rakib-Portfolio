"use client";

import { useEffect, useRef, useState } from "react";

const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Counts a stat like "2M+", "~99%", "59" or "5.0" up to its final text when
 * it scrolls into view. Server HTML and reduced motion show the final text;
 * non-numeric values ("P→E→C") render as-is.
 */
export function CountUp({ value, delay = 0, className = "" }: { value: string; delay?: number; className?: string }) {
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!match || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, pre, num, post] = match;
    const target = parseFloat(num);
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    const fmt = (n: number) => `${pre}${n.toFixed(decimals)}${post}`;

    let raf = 0;
    let timer = 0;
    const el = ref.current;
    // only animate if it is not already readable on screen
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    const hiddenByIntro = parseFloat(getComputedStyle(el.closest("[data-hero-stats]") ?? el).opacity) < 0.5;
    if (onScreen && !hiddenByIntro) return;

    setText(fmt(0));
    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 700);
        setText(t >= 1 ? value : fmt(target * io(t)));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        timer = window.setTimeout(run, delay);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      setText(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </span>
  );
}
