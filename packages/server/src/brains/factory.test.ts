import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./factory.js";
import type { AgentConfig } from "@talesauce/shared";

const agent: AgentConfig = {
  id: "a1", name: "Willow", environment: "farm", brainKind: "openclaw",
  personality: { skill: "chores", personality: "warm", speakingStyle: "gentle", appearance: "hat", idleActions: ["water"], workAnimation: "water" },
  pos: { x: 1, y: 1 },
};

describe("buildSystemPrompt", () => {
  it("includes name, personality and the QUESTION/DONE protocol", () => {
    const p = buildSystemPrompt(agent);
    expect(p).toContain("Willow");
    expect(p).toContain("warm");
    expect(p).toContain("❓QUESTION:");
    expect(p).toContain("✅DONE:");
  });
});
