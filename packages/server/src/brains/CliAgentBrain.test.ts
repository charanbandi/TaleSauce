import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "node:stream";
import { CliAgentBrain } from "./CliAgentBrain.js";
import type { SpawnFn } from "./cliProcess.js";
import type { BrainEvent } from "./AgentBrain.js";

function makeSpawnFn(lines: string[], exitCode = 0): SpawnFn {
  return (_cmd, _args, _opts) => {
    const stdout = new PassThrough();
    const closeListeners: ((code: number | null) => void)[] = [];
    setImmediate(() => {
      for (const line of lines) stdout.write(line + "\n");
      stdout.end();
      setTimeout(() => closeListeners.forEach((l) => l(exitCode)), 10);
    });
    return {
      stdout,
      kill: vi.fn(),
      on: (_ev: string, l: any) => { if (_ev === "close") closeListeners.push(l); },
    };
  };
}

describe("CliAgentBrain", () => {
  it("errors when no cwd is configured", () => {
    const events: BrainEvent[] = [];
    const brain = new CliAgentBrain({ kind: "codex", cwd: "", spawnFn: makeSpawnFn([]) });
    brain.on((e) => events.push(e));
    brain.start("task");
    expect(events.find((e) => e.type === "error")).toBeTruthy();
  });

  it("forwards events from the underlying bridge", async () => {
    const lines = [
      JSON.stringify({ type: "text", text: "hi" }),
      JSON.stringify({ type: "done", result: "Done." }),
    ];
    const events: BrainEvent[] = [];
    const brain = new CliAgentBrain({ kind: "codex", cwd: "/tmp", spawnFn: makeSpawnFn(lines) });
    brain.on((e) => events.push(e));
    brain.start("task");
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    expect(events.some((e) => e.type === "token")).toBe(true);
  });

  it("persists sessionId via onSession callback", async () => {
    const lines = [
      JSON.stringify({ type: "session", id: "thread_42" }),
      JSON.stringify({ type: "done" }),
    ];
    const onSession = vi.fn();
    const brain = new CliAgentBrain({ kind: "codex", cwd: "/tmp", spawnFn: makeSpawnFn(lines), onSession });
    brain.on(() => {});
    brain.start("task");
    await vi.waitFor(() => expect(brain.sessionId).toBe("thread_42"));
    expect(onSession).toHaveBeenCalledWith("thread_42");
  });

  it("decide() is a no-op (sandboxed — no permission events)", () => {
    const brain = new CliAgentBrain({ kind: "cursor", cwd: "/tmp", spawnFn: makeSpawnFn([]) });
    brain.on(() => {});
    expect(() => brain.decide("req1", true)).not.toThrow();
  });

  it("uses CursorBridge for kind=cursor (session key differs from Codex)", async () => {
    const lines = [
      JSON.stringify({ type: "session", sessionId: "cursor_abc" }),
      JSON.stringify({ type: "done" }),
    ];
    const onSession = vi.fn();
    const brain = new CliAgentBrain({ kind: "cursor", cwd: "/tmp", spawnFn: makeSpawnFn(lines), onSession });
    brain.on(() => {});
    brain.start("task");
    await vi.waitFor(() => expect(onSession).toHaveBeenCalledWith("cursor_abc"));
    expect(brain.sessionId).toBe("cursor_abc");
  });

  it("send() re-spawns with resume sessionId", async () => {
    const spawnCalls: string[][] = [];
    let callIndex = 0;
    const twoTurnSpawnFn: SpawnFn = (_cmd, args, _opts) => {
      spawnCalls.push(args);
      const lines = callIndex++ === 0
        ? [JSON.stringify({ type: "session", id: "s99" }), JSON.stringify({ type: "done", result: "t1" })]
        : [JSON.stringify({ type: "done", result: "t2" })];
      const stdout = new PassThrough();
      const closeListeners: ((code: number | null) => void)[] = [];
      setImmediate(() => { for (const l of lines) stdout.write(l + "\n"); stdout.end(); setTimeout(() => closeListeners.forEach((l) => l(0)), 10); });
      return { stdout, kill: vi.fn(), on: (_ev: string, l: any) => { if (_ev === "close") closeListeners.push(l); } };
    };

    const events: BrainEvent[] = [];
    const brain = new CliAgentBrain({ kind: "codex", cwd: "/tmp", spawnFn: twoTurnSpawnFn });
    brain.on((e) => events.push(e));
    brain.start("first task");
    await vi.waitFor(() => events.some((e) => e.type === "result" && (e as any).text === "t1"));

    // Ensure sessionId is persisted (readline event loop timing)
    await new Promise(r => setTimeout(r, 20));

    events.length = 0;
    brain.send("follow up");
    await vi.waitFor(() => events.some((e) => e.type === "result" && (e as any).text === "t2"));

    expect(spawnCalls[1].join(" ")).toContain("s99");
  });
});
