import { describe, it, expect } from "vitest";
import { OpenClawStreamParser } from "./sseParser.js";

/** Build SSE chunks the way OpenAI-compatible endpoints do. */
function sse(content: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

describe("OpenClawStreamParser", () => {
  it("emits tokens for plain content", () => {
    const tokens: string[] = [];
    const p = new OpenClawStreamParser({ onToken: (t) => tokens.push(t), onQuestion: () => {}, onResult: () => {} });
    p.push(sse("Hello ")); p.push(sse("world"));
    p.end();
    expect(tokens.join("")).toBe("Hello world");
  });

  it("detects a QUESTION marker and emits the question text", () => {
    let q = ""; const p = new OpenClawStreamParser({ onToken: () => {}, onQuestion: (t) => (q = t), onResult: () => {} });
    p.push(sse("❓QUESTION: Which folder should I use?"));
    p.end();
    expect(q).toBe("Which folder should I use?");
  });

  it("detects a DONE marker and emits the summary as result", () => {
    let r = ""; const p = new OpenClawStreamParser({ onToken: () => {}, onQuestion: () => {}, onResult: (t) => (r = t) });
    p.push(sse("✅DONE: Watered all the tomatoes."));
    p.end();
    expect(r).toBe("Watered all the tomatoes.");
  });

  it("falls back to accumulated text as result when stream ends without a marker", () => {
    let r = ""; const p = new OpenClawStreamParser({ onToken: () => {}, onQuestion: () => {}, onResult: (t) => (r = t) });
    p.push(sse("Did some work")); p.push("data: [DONE]\n\n");
    p.end();
    expect(r).toBe("Did some work");
  });

  it("ignores malformed SSE lines without throwing", () => {
    const p = new OpenClawStreamParser({ onToken: () => {}, onQuestion: () => {}, onResult: () => {} });
    expect(() => { p.push("data: {bad json\n\n"); p.end(); }).not.toThrow();
  });

  it("handles a marker split across two chunks", () => {
    let r = ""; const p = new OpenClawStreamParser({ onToken: () => {}, onQuestion: () => {}, onResult: (t) => (r = t) });
    p.push(sse("✅DO")); p.push(sse("NE: split summary"));
    p.end();
    expect(r).toBe("split summary");
  });

  it("does not leak a partial marker as a token (split marker)", () => {
    const tokens: string[] = [];
    let r = "";
    const p = new OpenClawStreamParser({ onToken: (t) => tokens.push(t), onQuestion: () => {}, onResult: (t) => (r = t) });
    p.push(sse("✅DO"));
    p.push(sse("NE: split summary"));
    p.end();
    // The partial "✅DO" must never appear in token output — onResult carries the payload
    expect(tokens.join("")).not.toContain("✅");
    expect(r).toBe("split summary");
  });

  it("emits text containing a marker-prefix char that is not a marker", () => {
    const tokens: string[] = [];
    const p = new OpenClawStreamParser({ onToken: (t) => tokens.push(t), onQuestion: () => {}, onResult: () => {} });
    // First delta ends with ✅ (held back as potential marker prefix).
    // Second delta makes the suffix " yes more" — not a marker — so the held text is released.
    p.push(sse("all done ✅ yes"));
    p.push(sse(" more"));
    p.end();
    // The lone ✅ followed by a space is NOT a marker; everything must be emitted as tokens.
    expect(tokens.join("")).toBe("all done ✅ yes more");
  });

  it("QUESTION marker split across chunks does not leak", () => {
    const tokens: string[] = [];
    let q = "";
    const p = new OpenClawStreamParser({ onToken: (t) => tokens.push(t), onQuestion: (t) => (q = t), onResult: () => {} });
    p.push(sse("❓QUES"));
    p.push(sse("TION: which one?"));
    p.end();
    expect(tokens.join("")).not.toContain("❓");
    expect(q).toBe("which one?");
  });
});
