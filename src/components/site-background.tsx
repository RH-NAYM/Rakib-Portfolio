"use client";

import { useEffect, useRef } from "react";

/**
 * Hero-only ambient backdrop — soft glow blobs + a particle constellation
 * (small moving dots connected by faint lines). Scoped to the Hero section
 * (`position: absolute` inside Hero's `relative` wrapper, not sitewide/fixed)
 * so it lives only behind the opening screen, then a bottom mask fades it
 * out to fully transparent before the page reaches the About section —
 * it never trails the visitor down the rest of the page.
 *
 * It never touches content boxes: `.card` and other surfaces paint a solid
 * background on top of it, so this only shows through in the empty space
 * around content — never inside boxes.
 *
 * Perf posture: capped node count, capped DPR, pauses when the tab is
 * hidden, fully disabled for prefers-reduced-motion. Scoped to the Hero's
 * own box (not the full document) keeps the canvas small and cheap.
 */
export function SiteBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    type Node = { x: number; y: number; vx: number; vy: number };
    let nodes: Node[] = [];

    const build = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(52, Math.floor((width * height) / 24000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 < 140 * 140) {
            const alpha = (1 - d2 / (140 * 140)) * 0.14;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    const stop = () => cancelAnimationFrame(raf);
    const onVisibility = () => (document.hidden ? stop() : start());

    build();
    start();
    window.addEventListener("resize", build);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("resize", build);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Bottom ~35% dissolves to fully transparent so the effect ends inside the
  // Hero instead of cutting off hard at its border.
  const fade = {
    maskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
  } as const;

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={fade}
      aria-hidden="true"
    >
      <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.14),transparent)] blur-2xl" />
      <div className="absolute -top-24 right-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.12),transparent)] blur-2xl" />
      <div className="absolute bottom-[-10%] left-[-6%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.08),transparent)] blur-2xl" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-50" />
    </div>
  );
}
