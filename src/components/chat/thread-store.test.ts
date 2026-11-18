import { describe, expect, it } from "vitest";
import { ALL, PROMPTS, STRING_KEYS, t } from "./strings";
import { emptyThread, historyFor, quoteOf, reducer, settleInFlight, type Msg, type Thread } from "./thread-store";

const visitor: Msg = { id: "v1", role: "visitor", text: "What do you do?", createdAt: 1 };
const sent = (): Thread => reducer(emptyThread(), { type: "send", visitor, twinId: "t1" });
const twin = (th: Thread) => th.messages.find((m) => m.id === "t1")!;
const final = {
  v: 1 as const, type: "final" as const, msg_id: "m", text: "I lead the team.[[1]]", lang: "en" as const,
  sources: [{ n: 1, title: "CV", url: "/cv.pdf" }], media: [], card: null,
  trace: { plan: [], source_count: 1, revisions: 0, elapsed_ms: 6200, critic: { passed: true, removed_sentences: 0 } },
};

describe("thread reducer", () => {
  it("send adds the visitor message and a waiting twin bubble with an instant planning chip", () => {
    const th = sent();
    expect(th.messages[0].status).toBe("sending");
    expect(twin(th)).toMatchObject({ status: "waiting", replyToVisitorId: "v1", steps: [{ step: "planning", status: "active" }] });
  });

  it("step events update in place and append new steps", () => {
    let th = reducer(sent(), { type: "step", twinId: "t1", event: { v: 1, type: "step", step: "planning", status: "done" } });
    th = reducer(th, { type: "step", twinId: "t1", event: { v: 1, type: "step", step: "reading", status: "active" } });
    expect(twin(th).steps).toEqual([{ step: "planning", status: "done" }, { step: "reading", status: "active" }]);
  });

  it("final completes the answer and marks the visitor message sent", () => {
    const th = reducer(reducer(sent(), { type: "token", twinId: "t1", text: "I lead" }), { type: "final", twinId: "t1", event: final });
    expect(twin(th)).toMatchObject({ status: "done", text: "I lead the team.[[1]]" });
    expect(th.messages[0].status).toBe("sent");
  });

  it("an error after tokens becomes a partial answer (design 2A)", () => {
    const th = reducer(reducer(sent(), { type: "token", twinId: "t1", text: "I lead" }), { type: "error", twinId: "t1", kind: "upstream_unavailable" });
    expect(twin(th)).toMatchObject({ status: "error", errorKind: "partial", text: "I lead" });
  });

  it("rate limits keep their kind and retry time even after tokens", () => {
    const th = reducer(sent(), { type: "error", twinId: "t1", kind: "rate_limited", retryAfterS: 600 });
    expect(twin(th)).toMatchObject({ errorKind: "rate_limited", retryAfterS: 600 });
  });

  it("retry resets the same bubble to waiting", () => {
    let th = reducer(sent(), { type: "error", twinId: "t1", kind: "timeout" });
    th = reducer(th, { type: "retry", twinId: "t1" });
    expect(twin(th)).toMatchObject({ status: "waiting", text: "", errorKind: undefined });
  });

  it("clear keeps the disclosure dismissal", () => {
    const th = reducer(reducer(sent(), { type: "dismissDisclosure" }), { type: "clear" });
    expect(th.messages).toEqual([]);
    expect(th.disclosureDismissed).toBe(true);
  });
});

describe("in-memory thread (clears on reload)", () => {
  it("marks messages that were in flight when the panel unmounted as cut off", () => {
    const th = settleInFlight(reducer(sent(), { type: "token", twinId: "t1", text: "half" }));
    expect(twin(th)).toMatchObject({ status: "error", errorKind: "partial" });
    const waiting = settleInFlight(sent());
    expect(twin(waiting)).toMatchObject({ status: "error", errorKind: "upstream_unavailable" });
  });

  it("leaves finished messages alone", () => {
    const done = reducer(sent(), { type: "final", twinId: "t1", event: final });
    expect(settleInFlight(done)).toEqual(done);
  });

  it("history sends completed turns only, without citation markers", () => {
    let th = reducer(sent(), { type: "final", twinId: "t1", event: final });
    th = reducer(th, { type: "send", visitor: { ...visitor, id: "v2", text: "more?" }, twinId: "t2" });
    expect(historyFor(th, "t2")).toEqual([
      { role: "user", text: "What do you do?" },
      { role: "assistant", text: "I lead the team." },
      { role: "user", text: "more?" },
    ]);
  });
});

describe("strings (design 7C)", () => {
  it("every key has non-empty EN, বাংলা and Banglish copy", () => {
    for (const k of STRING_KEYS) for (const l of ["en", "bn", "banglish"] as const) expect(ALL[k][l].length, `${k}.${l}`).toBeGreaterThan(0);
  });
  it("interpolates variables and has 4 prompts per language", () => {
    expect(t("rateLimited", "en", { m: 12 })).toBe("You've asked a lot. Try again in 12 min.");
    for (const l of ["en", "bn", "banglish"] as const) expect(PROMPTS[l]).toHaveLength(4);
  });
});

describe("phases 1b-3 (reply-to, voice, images, language)", () => {
  it("quotes snapshot the text without citation markers, with an image thumb", () => {
    const img: Msg = { id: "i1", role: "visitor", text: "what's this?", createdAt: 1, attachment: { kind: "image", thumb: "data:x", description: "A dashboard" } };
    expect(quoteOf(img)).toEqual({ id: "i1", role: "visitor", text: "[image: A dashboard] what's this?", thumb: "data:x" });
    const twinMsg: Msg = { id: "t", role: "twin", text: "I built it.[[1]]", createdAt: 1 };
    expect(quoteOf(twinMsg).text).toBe("I built it.");
  });

  it("meta transcript fills the visitor's voice message and switches the UI language in Auto", () => {
    const voice: Msg = { id: "v9", role: "visitor", text: "", createdAt: 1, attachment: { kind: "audio", durationS: 3, waveform: [0.5] } };
    let th = reducer(emptyThread(), { type: "send", visitor: voice, twinId: "t9" });
    th = reducer(th, { type: "meta", twinId: "t9", event: { v: 1, type: "meta", transcript: "আপনি কী করেন?", lang: "bn" } });
    const v = th.messages.find((m) => m.id === "v9")!;
    expect(v.text).toBe("আপনি কী করেন?");
    expect(v.attachment).toMatchObject({ kind: "audio", transcript: "আপনি কী করেন?" });
    expect(th.uiLang).toBe("bn");
  });

  it("an explicit language choice wins over the detected language", () => {
    let th = reducer(emptyThread(), { type: "langChoice", choice: "en" });
    th = reducer(th, { type: "lang", lang: "banglish" });
    expect(th.uiLang).toBe("en");
    th = reducer(th, { type: "langChoice", choice: "auto" });
    th = reducer(th, { type: "lang", lang: "banglish" });
    expect(th.uiLang).toBe("banglish");
  });

  it("image descriptions from the server attach to the visitor's image", () => {
    const img: Msg = { id: "i2", role: "visitor", text: "", createdAt: 1, attachment: { kind: "image", thumb: "data:x" } };
    let th = reducer(emptyThread(), { type: "send", visitor: img, twinId: "t2" });
    th = reducer(th, { type: "meta", twinId: "t2", event: { v: 1, type: "meta", image_description: "Retail dashboard" } });
    expect(th.messages[0].attachment).toMatchObject({ description: "Retail dashboard" });
  });

  it("history describes images instead of dropping them", () => {
    const img: Msg = { id: "i3", role: "visitor", text: "explain", createdAt: 1, attachment: { kind: "image", thumb: "x", description: "A chart" } };
    const th = reducer(emptyThread(), { type: "send", visitor: img, twinId: "t3" });
    th.messages.push({ id: "v4", role: "visitor", text: "next", createdAt: 2 });
    expect(historyFor(th, "v4")[0]).toEqual({ role: "user", text: "[image: A chart] explain" });
  });
});
