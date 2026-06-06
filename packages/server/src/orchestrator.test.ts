import { describe, it, expect } from "vitest";
import { Orchestrator } from "./orchestrator.js";
import { Db } from "./db/db.js";
import type { AgentBrain, BrainListener, BrainEvent } from "./brains/AgentBrain.js";
import type { ServerEvent, AgentConfig } from "@talesauce/shared";

class FakeBrain implements AgentBrain {
  listener?: BrainListener;
  decided?: { requestId: string; allow: boolean };
  on(l: BrainListener) { this.listener = l; }
  start() {}
  send() {}
  stop() {}
  decide(requestId: string, allow: boolean) { this.decided = { requestId, allow }; }
  fire(e: BrainEvent) { this.listener?.(e); }
}

const agent: AgentConfig = {
  id: "a1", name: "Willow", environment: "farm", brainKind: "openclaw",
  personality: { skill: "s", personality: "p", speakingStyle: "ss", appearance: "a", idleActions: ["water"], workAnimation: "water" },
  pos: { x: 1, y: 1 },
};

function setup() {
  const db = new Db(":memory:");
  db.insertAgent(agent);
  const fake = new FakeBrain();
  const out: ServerEvent[] = [];
  const orch = new Orchestrator(db, () => fake);
  orch.onEvent((e) => out.push(e));
  return { orch, fake, out, db };
}

describe("Orchestrator", () => {
  it("maps working state to agent-state event with activity summary", () => {
    const { orch, fake, out } = setup();
    orch.startTask("a1", "water the plants");
    fake.fire({ type: "state", state: "working" });
    const ev = out.find((e) => e.type === "agent-state") as any;
    expect(ev.agentId).toBe("a1");
    expect(ev.state).toBe("working");
    expect(ev.activity.toLowerCase()).toContain("working");
  });

  it("forwards tokens", () => {
    const { orch, fake, out } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "token", text: "hello" });
    expect(out).toContainEqual({ type: "token", agentId: "a1", text: "hello" });
  });

  it("maps question to walking-to-front + question event and persists it", () => {
    const { orch, fake, out, db } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "question", text: "which field?" });
    const states = out.filter((e) => e.type === "agent-state").map((e: any) => e.state);
    expect(states).toContain("walking-to-front");
    expect(states).toContain("awaiting-user");
    expect(out).toContainEqual({ type: "question", agentId: "a1", text: "which field?" });
    expect(db.listMessages("a1").some((m) => m.kind === "question")).toBe(true);
  });

  it("maps result to reporting then idle and persists result", () => {
    const { orch, fake, out, db } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "result", text: "all watered" });
    const states = out.filter((e) => e.type === "agent-state").map((e: any) => e.state);
    expect(states).toContain("reporting");
    expect(states[states.length - 1]).toBe("idle");
    expect(out).toContainEqual({ type: "result", agentId: "a1", text: "all watered" });
    expect(db.listMessages("a1").some((m) => m.kind === "result")).toBe(true);
  });

  it("maps brain error to error state event", () => {
    const { orch, fake, out } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "error", message: "down" });
    const ev = out.find((e) => e.type === "error") as any;
    expect(ev.message).toBe("down");
    const last = out.filter((e) => e.type === "agent-state").map((e: any) => e.state).pop();
    expect(last).toBe("idle");
  });

  it("maps a permission BrainEvent to awaiting-permission + permission ServerEvent and tracks it", () => {
    const { orch, fake, out } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "permission", requestId: "r1", tool: "Bash", summary: "Run: npm test" });
    const states = out.filter((e) => e.type === "agent-state").map((e: any) => e.state);
    expect(states).toContain("awaiting-permission");
    expect(out).toContainEqual({ type: "permission", agentId: "a1", requestId: "r1", tool: "Bash", summary: "Run: npm test" });
    expect(orch.pendingPermissions("a1")).toContainEqual({ requestId: "r1", tool: "Bash", summary: "Run: npm test" });
  });

  it("removeAllAgents() deletes every agent and emits agent-removed for each", () => {
    const db = new Db(":memory:");
    db.insertAgent(agent);
    db.insertAgent({ ...agent, id: "a2", name: "Kai", environment: "office", brainKind: "openclaw" });
    const out: ServerEvent[] = [];
    const orch = new Orchestrator(db, () => new FakeBrain());
    orch.onEvent((e) => out.push(e));
    expect(orch.runtimes()).toHaveLength(2);

    orch.removeAllAgents();

    expect(orch.runtimes()).toEqual([]);
    expect(db.listAgents()).toEqual([]);
    const removed = out.filter((e) => e.type === "agent-removed").map((e: any) => e.agentId).sort();
    expect(removed).toEqual(["a1", "a2"]);
  });

  it("decide() forwards to the brain and emits permission-resolved", () => {
    const { orch, fake, out } = setup();
    orch.startTask("a1", "x");
    fake.fire({ type: "permission", requestId: "r1", tool: "Bash", summary: "Run: npm test" });
    orch.decide("a1", "r1", true);
    expect((fake as any).decided).toEqual({ requestId: "r1", allow: true });
    expect(out).toContainEqual({ type: "permission-resolved", agentId: "a1", requestId: "r1" });
    expect(orch.pendingPermissions("a1")).toEqual([]);
  });
});
