import { describe, it, expect, vi } from "vitest";
import { ClaudeCodeBrain } from "./ClaudeCodeBrain.js";
import type { SdkMessage, QueryFn } from "./CodingAgentBridge.js";
import type { BrainEvent } from "./AgentBrain.js";

const fakeQuery: QueryFn = () => {
  async function* gen(): AsyncGenerator<SdkMessage> {
    yield { type: "system", subtype: "init", session_id: "s9" };
    yield { type: "assistant", message: { content: [{ type: "text", text: "hi" }] } };
    yield { type: "result", subtype: "success", result: "ok" };
  }
  return Object.assign(gen(), { interrupt: async () => {} });
};

describe("ClaudeCodeBrain", () => {
  it("forwards bridge events and exposes the live session id", async () => {
    const events: BrainEvent[] = [];
    const brain = new ClaudeCodeBrain({ cwd: "/repo", queryFn: fakeQuery });
    brain.on((e) => events.push(e));
    brain.start("task");
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    expect(brain.sessionId).toBe("s9");
    expect(events.some((e) => e.type === "token")).toBe(true);
  });
  it("errors clearly when no cwd is configured", () => {
    const events: BrainEvent[] = [];
    const brain = new ClaudeCodeBrain({ cwd: "", queryFn: fakeQuery });
    brain.on((e) => events.push(e));
    brain.start("task");
    expect(events.find((e) => e.type === "error")).toBeTruthy();
  });
});
