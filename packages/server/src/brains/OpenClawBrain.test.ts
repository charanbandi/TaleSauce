import { describe, it, expect, vi } from "vitest";
import { OpenClawBrain } from "./OpenClawBrain.js";
import type { BrainEvent } from "./AgentBrain.js";

/** A fake fetch returning a streaming body built from given SSE strings. */
function fakeFetch(chunks: string[]) {
  return vi.fn(async () => ({
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        for (const c of chunks) controller.enqueue(enc.encode(c));
        controller.close();
      },
    }),
  })) as unknown as typeof fetch;
}

const sse = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

const cfg = {
  url: "http://x", key: "k", model: "m",
  systemPrompt: "you are a test agent",
  history: [] as { role: string; content: string }[],
};

describe("OpenClawBrain", () => {
  it("streams tokens then emits result on DONE", async () => {
    const events: BrainEvent[] = [];
    const brain = new OpenClawBrain({ ...cfg }, fakeFetch([sse("Working "), sse("hard"), sse("✅DONE: all done")]));
    brain.on((e) => events.push(e));
    brain.start("do the thing");
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    expect(events.find((e) => e.type === "result")).toEqual({ type: "result", text: "all done" });
    expect(events.filter((e) => e.type === "token").map((e: any) => e.text).join("")).toBe("Working hard");
  });

  it("emits question on QUESTION marker", async () => {
    const events: BrainEvent[] = [];
    const brain = new OpenClawBrain({ ...cfg }, fakeFetch([sse("❓QUESTION: which one?")]));
    brain.on((e) => events.push(e));
    brain.start("ambiguous");
    await vi.waitFor(() => expect(events.some((e) => e.type === "question")).toBe(true));
    expect(events.find((e) => e.type === "question")).toEqual({ type: "question", text: "which one?" });
  });

  it("emits error state when fetch is not ok", async () => {
    const events: BrainEvent[] = [];
    const badFetch = vi.fn(async () => ({ ok: false, status: 503, text: async () => "down" })) as unknown as typeof fetch;
    const brain = new OpenClawBrain({ ...cfg }, badFetch);
    brain.on((e) => events.push(e));
    brain.start("x");
    await vi.waitFor(() => expect(events.some((e) => e.type === "error")).toBe(true));
  });
});
