import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { createSSEParser, splitCitations, type TwinEvent } from "./twin-events";

const schema = JSON.parse(readFileSync("contracts/sse-events.schema.json", "utf-8"));
const validate = new Ajv2020({ strict: false }).compile(schema);

const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const collect = () => {
  const got: TwinEvent[] = [];
  return { got, feed: createSSEParser((e) => got.push(e)) };
};

describe("createSSEParser", () => {
  it("joins an event split across chunks", () => {
    const { got, feed } = collect();
    const f = frame({ v: 1, type: "token", text: "Ami eta build korechi" });
    feed(f.slice(0, 13));
    expect(got).toHaveLength(0);
    feed(f.slice(13));
    expect(got).toEqual([{ v: 1, type: "token", text: "Ami eta build korechi" }]);
  });

  it("emits every event when several arrive in one chunk", () => {
    const { got, feed } = collect();
    feed(frame({ v: 1, type: "step", step: "planning", status: "active" }) + frame({ v: 1, type: "step", step: "planning", status: "done" }));
    expect(got.map((e) => (e as { status: string }).status)).toEqual(["active", "done"]);
  });

  it("ignores unknown types, other versions and malformed frames (eng D9)", () => {
    const { got, feed } = collect();
    feed(frame({ v: 1, type: "future_thing", x: 1 }) + frame({ v: 2, type: "token", text: "x" }) + "data: {not json\n\n" + frame({ v: 1, type: "token", text: "ok", extra: true }));
    expect(got).toEqual([{ v: 1, type: "token", text: "ok", extra: true }]);
  });

  it("handles CRLF line endings", () => {
    const { got, feed } = collect();
    feed(`data: ${JSON.stringify({ v: 1, type: "token", text: "a" })}\r\n\r\n`);
    expect(got).toHaveLength(1);
  });
});

describe("splitCitations", () => {
  it("turns [[n]] markers into cite parts", () => {
    expect(splitCitations("I lead it.[[1]] Big.[[2]][[3]]")).toEqual([{ text: "I lead it." }, { cite: 1 }, { text: " Big." }, { cite: 2 }, { cite: 3 }]);
  });
  it("leaves plain text alone", () => {
    expect(splitCitations("হাই")).toEqual([{ text: "হাই" }]);
  });
});

describe("contract", () => {
  it("accepts a well-formed final event and rejects a broken one", () => {
    const final = {
      v: 1, type: "final", msg_id: "m_1", text: "x[[1]]", lang: "banglish",
      sources: [{ n: 1, title: "CV", url: "/cv.pdf" }], media: [], card: null,
      trace: { plan: [], source_count: 1, revisions: 0, elapsed_ms: 10, critic: { passed: true, removed_sentences: 0 } },
    };
    expect(validate(final)).toBe(true);
    expect(validate({ ...final, lang: "fr" })).toBe(false);
  });
});
