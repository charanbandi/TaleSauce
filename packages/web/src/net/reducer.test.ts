import { describe, it, expect } from "vitest";
import { applyEvent, initialState } from "./reducer.js";
import type { AgentRuntime } from "@talesauce/shared";

const rt = (id: string): AgentRuntime => ({
  config: { id, name: id, environment: "farm", brainKind: "openclaw",
    personality: { skill: "", personality: "", speakingStyle: "", appearance: "", idleActions: [], workAnimation: "" }, pos: { x: 0, y: 0 } },
  state: "idle", activity: "",
});

describe("applyEvent", () => {
  it("hello populates agents", () => {
    const s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    expect(Object.keys(s.agents)).toEqual(["a1"]);
  });
  it("agent-state updates state + activity", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "agent-state", agentId: "a1", state: "working", activity: "Working" });
    expect(s.agents.a1.state).toBe("working");
    expect(s.agents.a1.activity).toBe("Working");
  });
  it("token appends to the agent's streaming buffer", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "token", agentId: "a1", text: "he" });
    s = applyEvent(s, { type: "token", agentId: "a1", text: "llo" });
    expect(s.chat.a1).toBe("hello");
  });
  it("result commits the streamed text (not the summary) and clears the buffer", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "token", agentId: "a1", text: "Watering " });
    s = applyEvent(s, { type: "token", agentId: "a1", text: "the crops" });
    s = applyEvent(s, { type: "result", agentId: "a1", text: "Watered everything." });
    expect(s.chat.a1).toBe("");
    expect(s.messages.a1.at(-1)).toEqual({ role: "assistant", kind: "result", content: "Watering the crops" });
  });
  it("result falls back to the summary when nothing streamed", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "result", agentId: "a1", text: "All done." });
    expect(s.messages.a1.at(-1)).toEqual({ role: "assistant", kind: "result", content: "All done." });
  });
  it("question stores a question message", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "question", agentId: "a1", text: "which?" });
    expect(s.messages.a1.at(-1)).toEqual({ role: "assistant", kind: "question", content: "which?" });
  });
  it("error surfaces a chat message and clears the streaming buffer", () => {
    let s = applyEvent(initialState(), { type: "hello", agents: [rt("a1")] });
    s = applyEvent(s, { type: "token", agentId: "a1", text: "partial" });
    s = applyEvent(s, { type: "error", agentId: "a1", message: "OpenClaw is unreachable." });
    expect(s.chat.a1).toBe("");
    const last = s.messages.a1.at(-1)!;
    expect(last.role).toBe("assistant");
    expect(last.kind).toBe("result");
    expect(last.content).toContain("OpenClaw is unreachable.");
  });
});
