import { describe, it, expect } from "vitest";
import { Db } from "./db.js";
import type { AgentConfig } from "@talesauce/shared";

const agent = (id: string): AgentConfig => ({
  id, name: "Test", environment: "farm", brainKind: "openclaw",
  personality: { skill: "s", personality: "p", speakingStyle: "ss", appearance: "a", idleActions: ["water"], workAnimation: "dig" },
  pos: { x: 5, y: 5 },
});

describe("Db", () => {
  it("inserts and lists agents", () => {
    const db = new Db(":memory:");
    expect(db.countAgents()).toBe(0);
    db.insertAgent(agent("a1"));
    expect(db.countAgents()).toBe(1);
    expect(db.listAgents()[0].name).toBe("Test");
  });
  it("stores and reads messages in order", () => {
    const db = new Db(":memory:");
    db.insertMessage({ agentId: "a1", role: "user", content: "hi", kind: "task" });
    db.insertMessage({ agentId: "a1", role: "assistant", content: "done", kind: "result" });
    const msgs = db.listMessages("a1");
    expect(msgs.map((m) => m.content)).toEqual(["hi", "done"]);
  });
  it("updates an agent's brain config", () => {
    const db = new Db(":memory:");
    db.insertAgent(agent("a1"));
    db.updateAgent("a1", { model: "fast" });
    expect(db.getAgent("a1")!.model).toBe("fast");
  });
  it("round-trips settings with defaults", () => {
    const db = new Db(":memory:");
    expect(db.getSettings().sliderPct).toBe(50);
    db.saveSettings({ sliderPct: 30, focus: "farm" });
    expect(db.getSettings()).toEqual({ sliderPct: 30, focus: "farm" });
  });
});
