import { describe, it, expect } from "vitest";
import { buildSystemPrompt, makeBrainFactory } from "./factory.js";
import type { AgentConfig } from "@talesauce/shared";
import type { Env } from "../env.js";

const agent: AgentConfig = {
  id: "a1", name: "Willow", environment: "farm", brainKind: "openclaw",
  personality: { skill: "chores", personality: "warm", speakingStyle: "gentle", appearance: "hat", idleActions: ["water"], workAnimation: "water" },
  pos: { x: 1, y: 1 },
};

const baseAgent: AgentConfig = {
  id: "a2", name: "TestAgent", environment: "office", brainKind: "openclaw",
  personality: { skill: "testing", personality: "neutral", speakingStyle: "plain", appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop" },
  pos: { x: 0, y: 0 },
};

const env: Env = {
  openclawUrl: "http://localhost:11434",
  openclawKey: "test-key",
  taskModel: "gpt-4",
  claudeCodeEnabled: false,
  codexEnabled: false,
  cursorEnabled: false,
  defaultBrain: null,
} as unknown as Env;

const db = {
  listMessages: () => [],
  updateAgent: () => {},
} as any;

describe("buildSystemPrompt", () => {
  it("includes name, personality and the QUESTION/DONE protocol", () => {
    const p = buildSystemPrompt(agent);
    expect(p).toContain("Willow");
    expect(p).toContain("warm");
    expect(p).toContain("❓QUESTION:");
    expect(p).toContain("✅DONE:");
  });
});

describe("makeBrainFactory", () => {
  it('builds a CliAgentBrain for brainKind "codex"', async () => {
    const { CliAgentBrain } = await import("./CliAgentBrain.js");
    const factory = makeBrainFactory(db, env);
    const brain = factory({ ...baseAgent, brainKind: "codex", workingDir: "/tmp" });
    expect(brain).toBeInstanceOf(CliAgentBrain);
  });

  it('builds a CliAgentBrain for brainKind "cursor"', async () => {
    const { CliAgentBrain } = await import("./CliAgentBrain.js");
    const factory = makeBrainFactory(db, env);
    const brain = factory({ ...baseAgent, brainKind: "cursor", workingDir: "/tmp" });
    expect(brain).toBeInstanceOf(CliAgentBrain);
  });
});
