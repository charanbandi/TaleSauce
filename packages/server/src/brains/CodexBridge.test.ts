import { describe, it, expect } from "vitest";
import { CodexBridge } from "./CodexBridge.js";

/**
 * Codex CLI (`codex exec --json`) stream-JSON, per
 * https://developers.openai.com/codex/noninteractive :
 *   {"type":"thread.started","thread_id":"..."}
 *   {"type":"turn.started"}
 *   {"type":"item.started","item":{"type":"command_execution","command":"bash -lc ls"}}
 *   {"type":"item.completed","item":{"type":"agent_message","text":"final answer"}}
 *   {"type":"turn.completed","usage":{...}}
 *   {"type":"error"|"turn.failed", ...}
 */
describe("CodexBridge.parseLine", () => {
  it("maps thread.started to a session (thread_id)", () => {
    expect(new CodexBridge().parseLine({ type: "thread.started", thread_id: "0199-abc" }))
      .toEqual({ kind: "session", id: "0199-abc" });
  });

  it("maps an agent_message item.completed to a token", () => {
    expect(new CodexBridge().parseLine({ type: "item.completed", item: { type: "agent_message", text: "Here is the answer." } }))
      .toEqual({ kind: "token", text: "Here is the answer." });
  });

  it("maps a command_execution item.started to a Run: tool summary", () => {
    const item = new CodexBridge().parseLine({ type: "item.started", item: { type: "command_execution", command: "bash -lc 'npm test'" } });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toContain("npm test");
  });

  it("maps a file_change item.started to an Edit tool summary", () => {
    const item = new CodexBridge().parseLine({ type: "item.started", item: { type: "file_change", changes: [{ path: "src/foo.ts" }] } });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toContain("src/foo.ts");
  });

  it("ignores reasoning, turn.started, and item.updated", () => {
    const b = new CodexBridge();
    expect(b.parseLine({ type: "item.completed", item: { type: "reasoning", text: "thinking" } })).toEqual({ kind: "ignore" });
    expect(b.parseLine({ type: "turn.started" })).toEqual({ kind: "ignore" });
    expect(b.parseLine({ type: "item.updated", item: { type: "agent_message", text: "partial" } })).toEqual({ kind: "ignore" });
  });

  it("turn.completed yields a result carrying the last agent_message text", () => {
    const b = new CodexBridge();
    b.parseLine({ type: "item.completed", item: { type: "agent_message", text: "All done refactoring." } });
    expect(b.parseLine({ type: "turn.completed", usage: {} })).toEqual({ kind: "result", text: "All done refactoring." });
  });

  it("turn.completed with no message yields a result with no text", () => {
    expect(new CodexBridge().parseLine({ type: "turn.completed" })).toEqual({ kind: "result", text: undefined });
  });

  it("resets remembered text at turn.started so a new turn does not leak the old message", () => {
    const b = new CodexBridge();
    b.parseLine({ type: "item.completed", item: { type: "agent_message", text: "first" } });
    b.parseLine({ type: "turn.started" });
    expect(b.parseLine({ type: "turn.completed" })).toEqual({ kind: "result", text: undefined });
  });

  it("maps error and turn.failed to error", () => {
    const b = new CodexBridge();
    expect(b.parseLine({ type: "error", message: "boom" })).toEqual({ kind: "error", message: "boom" });
    expect(b.parseLine({ type: "turn.failed", error: { message: "exec blocked" } })).toEqual({ kind: "error", message: "exec blocked" });
  });

  it("maps unknown lines to ignore", () => {
    expect(new CodexBridge().parseLine({ type: "something_new" })).toEqual({ kind: "ignore" });
  });
});

describe("CodexBridge.buildArgs", () => {
  it("fresh run uses exec with the json + sandbox + cwd flags", () => {
    expect(new CodexBridge().buildArgs("do it", { cwd: "/repo" }))
      .toEqual(["exec", "--json", "--sandbox", "workspace-write", "-C", "/repo", "do it"]);
  });

  it("resume run uses the `exec resume <id>` subcommand", () => {
    const args = new CodexBridge().buildArgs("more", { cwd: "/repo", sessionId: "sess1" });
    expect(args.slice(0, 3)).toEqual(["exec", "resume", "sess1"]);
    expect(args).toContain("--json");
    expect(args[args.length - 1]).toBe("more");
  });

  it("includes --model when configured", () => {
    const args = new CodexBridge(undefined, undefined, "o4-mini").buildArgs("x", { cwd: "/r" });
    expect(args).toContain("--model");
    expect(args).toContain("o4-mini");
  });
});
