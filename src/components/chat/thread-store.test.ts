import { describe, expect, it } from "vitest";
import { ALL, PROMPTS, STRING_KEYS, t } from "./strings";
import { emptyThread, historyFor, loadThread, reducer, SCHEMA, serializeThread, type Msg, type Thread } from "./thread-store";

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

describe("persistence", () => {
  it("drops threads from another schema version silently", () => {
    expect(loadThread(JSON.stringify({ schema: SCHEMA + 1, messages: [visitor] }), "en").messages).toEqual([]);
    expect(loadThread("{corrupt", "en").messages).toEqual([]);
    expect(loadThread(null, "bn").uiLang).toBe("bn");
  });

  it("marks in-flight messages from a closed tab as cut off", () => {
    const th = loadThread(serializeThread(reducer(sent(), { type: "token", twinId: "t1", text: "half" })), "en");
    expect(twin(th)).toMatchObject({ status: "error", errorKind: "partial" });
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
