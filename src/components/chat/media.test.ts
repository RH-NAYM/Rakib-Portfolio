import { describe, expect, it } from "vitest";
import { buildLeadMessage } from "./chat-parts";
import { barsFromSamples, fitWithin } from "./media";
import type { Msg } from "./thread-store";

describe("fitWithin (image resize rule, design 2A)", () => {
  it("caps the longest side and never upscales", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ w: 1600, h: 1200 });
    expect(fitWithin(1080, 2400, 1600)).toEqual({ w: 720, h: 1600 });
    expect(fitWithin(800, 600, 1600)).toEqual({ w: 800, h: 600 });
  });
});

describe("barsFromSamples (voice waveform, design 7B)", () => {
  it("returns 24 bars normalised to the loudest", () => {
    const s = new Float32Array(2400).map((_, i) => (i < 1200 ? 0.1 : 0.8));
    const bars = barsFromSamples(s);
    expect(bars).toHaveLength(24);
    expect(Math.max(...bars)).toBe(1);
    expect(bars[0]).toBeCloseTo(0.13, 1);
  });
  it("handles silence without dividing by zero", () => {
    expect(barsFromSamples(new Float32Array(240)).every((b) => b === 0)).toBe(true);
  });
});

describe("buildLeadMessage (eng R3-7)", () => {
  const thread: Msg[] = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, role: i % 2 ? "twin" : "visitor", text: `turn ${i} ` + "x".repeat(900) + "[[1]]", createdAt: i }));
  it("puts the visitor's message first, labels the chat unverified, stays under the 5,000-char route cap", () => {
    const out = buildLeadMessage("Please call me about a CV project.", thread);
    expect(out.startsWith("Please call me about a CV project.")).toBe(true);
    expect(out).toContain("visitor-supplied, unverified");
    expect(out).not.toContain("[[1]]");
    expect(out.length).toBeLessThanOrEqual(4990);
    expect(out).toContain("turn 4"); // last 6 turns only
    expect(out).not.toContain("turn 3 ");
  });
});
