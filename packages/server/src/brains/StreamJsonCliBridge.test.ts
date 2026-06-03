import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "node:stream";
import type { SpawnFn, SpawnResult } from "./cliProcess.js";
import { StreamJsonCliBridge, type ParsedItem } from "./StreamJsonCliBridge.js";
import type { BrainEvent } from "./AgentBrain.js";

/** Builds a fake SpawnFn that emits scripted NDJSON lines then closes. */
function makeSpawnFn(lines: string[], exitCode = 0): { spawnFn: SpawnFn; killFn: ReturnType<typeof vi.fn> } {
  const killFn = vi.fn();
  const spawnFn: SpawnFn = (_cmd, _args, _opts) => {
    const stdout = new PassThrough();
    const closeListeners: ((code: number | null) => void)[] = [];
    setImmediate(() => {
      for (const line of lines) stdout.write(line + "\n");
      stdout.end();
      setTimeout(() => closeListeners.forEach((l) => l(exitCode)), 10);
    });
    const result: SpawnResult = {
      stdout,
      kill: killFn,
      on: (event, listener) => {
        if (event === "close") closeListeners.push(listener as (code: number | null) => void);
      },
    };
    return result;
  };
  return { spawnFn, killFn };
}

/** Minimal concrete implementation for testing the abstract base. */
class TestBridge extends StreamJsonCliBridge {
  get binary() { return "test-cli"; }
  buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[] {
    return [task, ...(opts.sessionId ? ["--resume", opts.sessionId] : [])];
  }
  parseLine(obj: Record<string, unknown>): ParsedItem {
    if (obj.type === "session") return { kind: "session", id: String(obj.id) };
    if (obj.type === "token") return { kind: "token", text: String(obj.text) };
    if (obj.type === "tool") return { kind: "tool", summary: String(obj.summary) };
    if (obj.type === "result") return { kind: "result", text: obj.text ? String(obj.text) : undefined };
    if (obj.type === "error") return { kind: "error", message: String(obj.message) };
    return { kind: "ignore" };
  }
}

describe("StreamJsonCliBridge", () => {
  it("emits tokens and result; sets streamedThisTurn to skip duplicate on result", async () => {
    const lines = [
      JSON.stringify({ type: "token", text: "Hello " }),
      JSON.stringify({ type: "token", text: "world" }),
      JSON.stringify({ type: "result", text: "Hello world" }),
    ];
    const { spawnFn } = makeSpawnFn(lines);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));

    const tokens = events.filter((e) => e.type === "token").map((e) => (e as any).text);
    expect(tokens).toEqual(["Hello ", "world"]); // NOT "Hello world" again
    expect(events.some((e) => e.type === "result" && (e as any).text === "Hello world")).toBe(true);
    expect(events.some((e) => e.type === "state" && (e as any).state === "done")).toBe(true);
  });

  it("emits result text as token when nothing was streamed first", async () => {
    const lines = [JSON.stringify({ type: "result", text: "Single answer" })];
    const { spawnFn } = makeSpawnFn(lines);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));

    const tokens = events.filter((e) => e.type === "token");
    expect(tokens.length).toBe(1);
    expect((tokens[0] as any).text).toBe("Single answer");
  });

  it("emits tool-activity (not permission) for tool events", async () => {
    const lines = [
      JSON.stringify({ type: "tool", summary: "Run: ls -la" }),
      JSON.stringify({ type: "result" }),
    ];
    const { spawnFn } = makeSpawnFn(lines);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));

    expect(events.some((e) => e.type === "tool-activity" && (e as any).summary === "Run: ls -la")).toBe(true);
    expect(events.some((e) => e.type === "permission")).toBe(false);
  });

  it("persists session id via onSession callback", async () => {
    const lines = [
      JSON.stringify({ type: "session", id: "sess_abc" }),
      JSON.stringify({ type: "result" }),
    ];
    const { spawnFn } = makeSpawnFn(lines);
    const onSession = vi.fn();
    const bridge = new TestBridge(spawnFn, onSession);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));

    expect(onSession).toHaveBeenCalledWith("sess_abc");
    expect(bridge.getSessionId()).toBe("sess_abc");
  });

  it("emits error and state:error when process exits non-zero without a result", async () => {
    const { spawnFn } = makeSpawnFn([], 1);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "error")).toBe(true));

    expect(events.some((e) => e.type === "state" && (e as any).state === "error")).toBe(true);
  });

  it("does NOT emit error when process exits 0 and result was already seen", async () => {
    const lines = [JSON.stringify({ type: "result", text: "Done" })];
    const { spawnFn } = makeSpawnFn(lines, 0);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    await new Promise((r) => setTimeout(r, 30)); // wait for close

    const errors = events.filter((e) => e.type === "error");
    expect(errors).toHaveLength(0);
  });

  it("emits no stray events after stop()", async () => {
    const { spawnFn, killFn } = makeSpawnFn([
      JSON.stringify({ type: "token", text: "partial" }),
    ], 1);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await new Promise((r) => setTimeout(r, 5));
    bridge.stop();
    expect(killFn).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 40)); // give close time to fire

    const postStop = events.filter((e) => e.type === "error" || e.type === "result");
    expect(postStop).toHaveLength(0);
  });

  it("reply re-spawns with session id for multi-turn", async () => {
    const spawnCalls: { args: string[] }[] = [];
    const lines1 = [JSON.stringify({ type: "result", text: "turn1" })];
    const lines2 = [JSON.stringify({ type: "result", text: "turn2" })];
    let callIndex = 0;
    const spawnFn: SpawnFn = (_cmd, args, _opts) => {
      spawnCalls.push({ args });
      const lines = callIndex++ === 0 ? lines1 : lines2;
      const stdout = new PassThrough();
      const closeListeners: ((code: number | null) => void)[] = [];
      setImmediate(() => {
        for (const line of lines) stdout.write(line + "\n");
        stdout.end();
        setTimeout(() => closeListeners.forEach((l) => l(0)), 10);
      });
      return { stdout, kill: vi.fn(), on: (_ev: string, l: any) => { if (_ev === "close") closeListeners.push(l); } };
    };

    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("task one", { cwd: "/tmp", sessionId: "s1" });
    await vi.waitFor(() => events.some((e) => e.type === "result" && (e as any).text === "turn1"));

    events.length = 0;
    bridge.reply("follow-up");
    await vi.waitFor(() => events.some((e) => e.type === "result" && (e as any).text === "turn2"));

    // Second spawn includes the session id in args
    expect(spawnCalls[1].args).toContain("s1");
  });

  it("skips malformed JSON lines without crashing", async () => {
    const lines = [
      "not json at all",
      JSON.stringify({ type: "result", text: "ok" }),
    ];
    const { spawnFn } = makeSpawnFn(lines);
    const bridge = new TestBridge(spawnFn);
    const events: BrainEvent[] = [];
    bridge.on((e) => events.push(e));

    bridge.start("do task", { cwd: "/tmp" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    expect(events.some((e) => e.type === "error")).toBe(false);
  });
});
