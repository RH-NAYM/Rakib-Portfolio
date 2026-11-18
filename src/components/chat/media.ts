"use client";

/** Browser-side media helpers (phases 2-3). Nothing here leaves the device except the encoded payload. */

export type Payload = { mime: string; data: string }; // base64, matches twin-agent MediaIn

export const MAX_IMAGE_INPUT = 10 * 1024 * 1024; // what we accept from the picker (design 2A copy)
export const MAX_RECORD_S = 60;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",", 2)[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function canvasBlob(c: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, q));
}

/** Pure sizing rule, shared with tests: longest side ≤ max, never upscale. */
export function fitWithin(w: number, h: number, max: number): { w: number; h: number } {
  const s = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

/**
 * Resize to ≤1600px JPEG (~<1 MB) and make a ≤30 KB thumbnail. Re-encoding through a canvas
 * drops EXIF (including GPS) as a side effect (design 2 / 6A).
 */
export async function prepareImage(file: File): Promise<{ payload: Payload; thumb: string }> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size > MAX_IMAGE_INPUT) throw new Error("bad image");
  const bmp = await createImageBitmap(file);
  const draw = (max: number) => {
    const { w, h } = fitWithin(bmp.width, bmp.height, max);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    return c;
  };
  let q = 0.8;
  let blob = await canvasBlob(draw(1600), "image/jpeg", q);
  while (blob.size > 1_000_000 && q > 0.45) {
    q -= 0.1;
    blob = await canvasBlob(draw(1600), "image/jpeg", q);
  }
  const thumb = draw(160).toDataURL("image/jpeg", 0.6);
  bmp.close();
  return { payload: { mime: "image/jpeg", data: await blobToBase64(blob) }, thumb };
}

export function pickRecorderMime(): string {
  const prefs = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return prefs.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

export function canRecord(): boolean {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined" && !!pickRecorderMime();
}

/** 24 normalized bars (0..1) from decoded audio, for the voice bubble (design 7B). */
export function barsFromSamples(samples: Float32Array, bars = 24): number[] {
  const size = Math.max(1, Math.floor(samples.length / bars));
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    let peak = 0;
    for (let j = i * size; j < Math.min(samples.length, (i + 1) * size); j++) peak = Math.max(peak, Math.abs(samples[j]));
    out.push(peak);
  }
  const max = Math.max(...out, 1e-6);
  return out.map((v) => Math.round((v / max) * 100) / 100);
}

export async function waveformOf(blob: Blob): Promise<{ bars: number[]; durationS: number }> {
  try {
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    void ctx.close();
    return { bars: barsFromSamples(buf.getChannelData(0)), durationS: Math.round(buf.duration) };
  } catch {
    return { bars: Array(24).fill(0.3), durationS: 0 };
  }
}

export class VoiceRecorder {
  private rec: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private onInterrupt: () => void;
  startedAt = 0;

  constructor(onInterrupt: () => void) {
    this.onInterrupt = onInterrupt;
  }

  /** Throws a DOMException named NotAllowedError when the visitor (or OS) denies the mic. */
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream, { mimeType: pickRecorderMime(), audioBitsPerSecond: 32000 });
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.stream.getTracks().forEach((t) => (t.onended = () => this.onInterrupt())); // call / device change
    this.rec.start(250);
    this.startedAt = Date.now();
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.rec;
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = () => {
        this.release();
        resolve(new Blob(this.chunks, { type: rec.mimeType || "audio/webm" }));
      };
      rec.stop();
    });
  }

  cancel(): void {
    if (this.rec && this.rec.state !== "inactive") {
      this.rec.onstop = null;
      this.rec.stop();
    }
    this.release();
  }

  private release() {
    this.stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    this.stream = null;
    this.rec = null;
  }
}
