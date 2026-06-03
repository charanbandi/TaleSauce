import { describe, it, expect } from "vitest";
import { CursorBridge } from "./CursorBridge.js";

/**
 * cursor-agent CLI stream-JSON format when run with `-p --output-format stream-json`:
 *   {"type":"session","sessionId":"cursor_xyz"}
 *   {"type":"message","delta":"Hello "}
 *   {"type":"message","delta":"world"}
 *   {"type":"tool","name":"codemod","args":{"file":"src/foo.ts"},"summary":"Edit: src/foo.ts"}
 *   {"type":"done","message":"Task complete."}
 *
 * NOTE: If your installed cursor-agent version emits different keys,
 * adjust parseLine() in CursorBridge.ts and update these tests.
 */
describe("CursorBridge.parseLine", () => {
  const b = new CursorBridge();

  it("maps session event (sessionId key)", () => {
    expect(b.parseLine({ type: "session", sessionId: "cursor_xyz" }))
      .toEqual({ kind: "session", id: "cursor_xyz" });
  });

  it("maps session event (fallback to id key)", () => {
    expect(b.parseLine({ type: "session", id: "cursor_fallback" }))
      .toEqual({ kind: "session", id: "cursor_fallback" });
  });

  it("maps message delta to token", () => {
    expect(b.parseLine({ type: "message", delta: "Hello " }))
      .toEqual({ kind: "token", text: "Hello " });
  });

  it("maps tool event — uses provided summary if present", () => {
    const item = b.parseLine({ type: "tool", name: "codemod", args: { file: "src/foo.ts" }, summary: "Edit: src/foo.ts" });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toBe("Edit: src/foo.ts");
  });

  it("maps tool event — builds summary from args when no summary provided", () => {
    const item = b.parseLine({ type: "tool", name: "bash", args: { command: "npm run build" } });
    expect(item.kind).toBe("tool");
    expect((item as any).summary).toContain("npm run build");
  });

  it("maps done event with message", () => {
    expect(b.parseLine({ type: "done", message: "Task complete." }))
      .toEqual({ kind: "result", text: "Task complete." });
  });

  it("maps done event without message", () => {
    expect(b.parseLine({ type: "done" }))
      .toEqual({ kind: "result", text: undefined });
  });

  it("maps unknown type to ignore", () => {
    expect(b.parseLine({ type: "heartbeat" }))
      .toEqual({ kind: "ignore" });
  });
});

describe("CursorBridge.buildArgs", () => {
  const b = new CursorBridge();

  it("builds basic args", () => {
    const args = b.buildArgs("fix the bug", { cwd: "/repo" });
    expect(args).toContain("-p");
    expect(args).toContain("--output-format");
    expect(args).toContain("stream-json");
    expect(args[args.length - 1]).toBe("fix the bug");
  });

  it("includes resume flag when sessionId provided", () => {
    const args = b.buildArgs("continue", { cwd: "/repo", sessionId: "cursor_xyz" });
    expect(args).toContain("cursor_xyz");
  });

  it("omits resume when no sessionId", () => {
    const args = b.buildArgs("start", { cwd: "/repo" });
    expect(args.join(" ")).not.toContain("undefined");
    expect(args.join(" ")).not.toContain("--resume");
  });
});
