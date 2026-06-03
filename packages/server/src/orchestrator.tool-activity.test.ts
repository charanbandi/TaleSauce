import { describe, it, expect, vi } from "vitest";
import type { BrainEvent } from "./brains/AgentBrain.js";

describe("orchestrator tool-activity handling", () => {
  it("updates agent activity line when tool-activity brain event fires", async () => {
    const { Db } = await import("./db/db.js");
    const { Orchestrator } = await import("./orchestrator.js");
    const db = new Db(":memory:");
    db.migrate();

    const listeners: ((e: BrainEvent) => void)[] = [];
    const fakeBrain = {
      start: vi.fn(),
      send: vi.fn(),
      stop: vi.fn(),
      on: (l: (e: BrainEvent) => void) => listeners.push(l),
    };

    const orch = new Orchestrator(db, () => fakeBrain as any);
    const cfg = {
      id: "a1", name: "Test", environment: "office" as const, brainKind: "codex" as const,
      personality: { skill: "s", personality: "p", speakingStyle: "c", appearance: "d", idleActions: [], workAnimation: "w" },
      pos: { x: 0, y: 0 },
    };
    db.insertAgent(cfg);
    // bind the brain by calling addAgent (which calls bind internally)
    // We need the brain listener to be wired up — use the orch constructor which reads from db
    const orch2 = new Orchestrator(db, () => fakeBrain as any);
    const serverEvents: any[] = [];
    orch2.onEvent((e) => serverEvents.push(e));

    // fire the tool-activity event via the registered listener
    for (const l of listeners) l({ type: "tool-activity", summary: "Run: ls -la" });

    // activity should be updated in the runtime
    const runtime = orch2.runtimes().find((r) => r.config.id === "a1");
    expect(runtime?.activity).toBe("Run: ls -la");

    // agent-state event should have been emitted
    const stateEv = serverEvents.find((e) => e.type === "agent-state");
    expect(stateEv).toBeTruthy();
  });
});
