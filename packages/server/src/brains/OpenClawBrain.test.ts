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

  it("does not emit result/done when stopped mid-stream", async () => {
    const events: BrainEvent[] = [];
    let rejectPull: ((e: unknown) => void) | null = null;
    const sseChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: "Working " } }] })}\n\n`;
    const fetchImpl = (async (_url: string, _init: any) => ({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(new TextEncoder().encode(sseChunk)); },
        // second read hangs until we reject it (simulating the aborted fetch read rejecting)
        pull() { return new Promise<void>((_res, rej) => { rejectPull = rej; }); },
      }),
    })) as unknown as typeof fetch;

    const brain = new OpenClawBrain({ ...cfg }, fetchImpl);
    brain.on((e) => events.push(e));
    brain.start("do it");
    // let the first chunk be read and the second read begin pending
    await vi.waitFor(() => expect(events.some((e) => e.type === "token")).toBe(true));
    brain.stop();                       // sets controller.signal.aborted = true
    rejectPull?.(new DOMException("Aborted", "AbortError")); // reject the pending read
    // give microtasks a chance to flush
    await new Promise((r) => setTimeout(r, 10));
    expect(events.some((e) => e.type === "result")).toBe(false);
    expect(events.some((e) => e.type === "state" && (e as any).state === "done")).toBe(false);
  });
});
