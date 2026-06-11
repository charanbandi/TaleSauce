import { describe, it, expect } from "vitest";
import { CursorBridge } from "./CursorBridge.js";

/**
 * cursor-agent (`-p --output-format stream-json`), per
 * https://cursor.com/docs/cli/reference/output-format :
 *   {"type":"system","subtype":"init","session_id":"...","model":"...","cwd":"..."}
 *   {"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]}}
 *   {"type":"tool_call","subtype":"started","tool_call":{"readToolCall":{"args":{"path":"x"}}}}
 *   {"type":"result","subtype":"success","result":"final text","is_error":false}
 */
describe("CursorBridge.parseLine", () => {
  const b = new CursorBridge();

  it("maps system/init to a session (session_id)", () => {
    expect(b.parseLine({ type: "system", subtype: "init", session_id: "uuid-1", model: "gpt-5", cwd: "/r" }))
      .toEqual({ kind: "session", id: "uuid-1" });
  });

  it("maps an assistant message to a token", () => {
    expect(b.parseLine({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Hello there" }] }, session_id: "uuid-1" }))
      .toEqual({ kind: "token", text: "Hello there" });
  });

  it("concatenates multiple text parts in one assistant message", () => {
    expect(b.parseLine({ type: "assistant", message: { content: [{ type: "text", text: "foo " }, { type: "text", text: "bar" }] } }))
      .toEqual({ kind: "token", text: "foo bar" });
  });

  it("maps a started tool_call to a tool summary (file path)", () => {
    const item = b.parseLine({ type: "tool_call", subtype: "started", tool_call: { readToolCall: { args: { path: "src/x.ts" } } } });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toContain("src/x.ts");
  });

  it("summarises a shell tool_call by its command", () => {
    const item = b.parseLine({ type: "tool_call", subtype: "started", tool_call: { shellToolCall: { args: { command: "npm run build" } } } });
    expect((item as any).summary).toContain("npm run build");
  });

  it("maps a successful result to a result with the final text", () => {
    expect(b.parseLine({ type: "result", subtype: "success", result: "Final answer.", session_id: "uuid-1", is_error: false }))
      .toEqual({ kind: "result", text: "Final answer." });
  });

  it("maps an errored result to an error", () => {
    const item = b.parseLine({ type: "result", subtype: "error", result: "Something failed", is_error: true });
    expect(item.kind).toBe("error");
    expect((item as any).message).toContain("Something failed");
  });

  it("ignores user echoes and completed tool calls", () => {
    expect(b.parseLine({ type: "user", message: { content: [] } })).toEqual({ kind: "ignore" });
    expect(b.parseLine({ type: "tool_call", subtype: "completed", tool_call: {} })).toEqual({ kind: "ignore" });
  });
});

describe("CursorBridge.buildArgs", () => {
  it("fresh run is `-p --output-format stream-json <task>`", () => {
    expect(new CursorBridge().buildArgs("hi", { cwd: "/r" }))
      .toEqual(["-p", "--output-format", "stream-json", "hi"]);
  });

  it("resume adds --resume <id>", () => {
    const args = new CursorBridge().buildArgs("again", { cwd: "/r", sessionId: "chat9" });
    expect(args).toContain("--resume");
    expect(args).toContain("chat9");
    expect(args[args.length - 1]).toBe("again");
  });

  it("includes --model when configured", () => {
    const args = new CursorBridge(undefined, undefined, "sonnet").buildArgs("x", { cwd: "/r" });
    expect(args).toContain("--model");
    expect(args).toContain("sonnet");
  });
});
