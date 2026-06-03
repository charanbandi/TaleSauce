import { describe, it, expect } from "vitest";
import { CodexBridge } from "./CodexBridge.js";

/**
 * Codex CLI (openai/codex) stream-JSON output format when run with `--json`:
 *   {"type":"session","id":"thread_abc"}
 *   {"type":"text","text":"Some streamed text"}
 *   {"type":"tool_call","tool":"bash","args":{"command":"ls -la"},"id":"tc1"}
 *   {"type":"tool_result","call_id":"tc1","output":"file.txt"}
 *   {"type":"done","result":"Task complete."}
 *
 * NOTE: If the installed Codex CLI version emits slightly different keys,
 * adjust parseLine() in CodexBridge.ts and update the tests to match.
 */
describe("CodexBridge.parseLine", () => {
  const b = new CodexBridge();

  it("maps session event", () => {
    expect(b.parseLine({ type: "session", id: "thread_abc" }))
      .toEqual({ kind: "session", id: "thread_abc" });
  });

  it("maps text delta to token", () => {
    expect(b.parseLine({ type: "text", text: "Hello " }))
      .toEqual({ kind: "token", text: "Hello " });
  });

  it("maps tool_call to tool with summarised label (bash command)", () => {
    const item = b.parseLine({ type: "tool_call", tool: "bash", args: { command: "npm test" }, id: "tc1" });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toContain("npm test");
  });

  it("maps tool_call without command to Use: label", () => {
    const item = b.parseLine({ type: "tool_call", tool: "grep", args: { pattern: "foo" }, id: "tc2" });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toMatch(/Use:|grep/i);
  });

  it("maps tool_result to ignore", () => {
    expect(b.parseLine({ type: "tool_result", call_id: "tc1", output: "file.txt" }))
      .toEqual({ kind: "ignore" });
  });

  it("maps done event with result text", () => {
    expect(b.parseLine({ type: "done", result: "Task complete." }))
      .toEqual({ kind: "result", text: "Task complete." });
  });

  it("maps done event without result text", () => {
    expect(b.parseLine({ type: "done" }))
      .toEqual({ kind: "result", text: undefined });
  });

  it("maps unknown type to ignore", () => {
    expect(b.parseLine({ type: "something_new", data: "x" }))
      .toEqual({ kind: "ignore" });
  });
});

describe("CodexBridge.buildArgs", () => {
  const b = new CodexBridge();

  it("builds basic args with cwd and task", () => {
    const args = b.buildArgs("write a test", { cwd: "/repo" });
    expect(args).toContain("exec");
    expect(args).toContain("--json");
    expect(args).toContain("--sandbox");
    expect(args).toContain("workspace-write");
    expect(args).toContain("-C");
    expect(args).toContain("/repo");
    expect(args[args.length - 1]).toBe("write a test");
  });

  it("includes resume flag when sessionId provided", () => {
    const args = b.buildArgs("continue", { cwd: "/repo", sessionId: "thread_xyz" });
    expect(args).toContain("thread_xyz");
  });

  it("omits resume flag when no sessionId", () => {
    const args = b.buildArgs("start fresh", { cwd: "/repo" });
    expect(args.join(" ")).not.toContain("resume");
    expect(args.join(" ")).not.toContain("undefined");
  });
});
