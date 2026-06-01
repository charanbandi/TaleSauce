import { describe, it, expect, vi } from "vitest";
import { ClaudeCodeBridge } from "./ClaudeCodeBridge.js";
import type { SdkMessage, QueryFn, CanUseTool } from "./CodingAgentBridge.js";
import type { BrainEvent } from "./AgentBrain.js";

/** A fake query() that yields the given messages, optionally calling canUseTool first. */
function fakeQuery(messages: SdkMessage[], opts?: { askTool?: { name: string; input: any } }): QueryFn {
  return (args) => {
    const canUseTool = args.options.canUseTool as CanUseTool | undefined;
    async function* gen(): AsyncGenerator<SdkMessage> {
      if (opts?.askTool && canUseTool) {
        const res = await canUseTool(opts.askTool.name, opts.askTool.input);
        yield { type: "assistant", message: { content: [{ type: "text", text: res.behavior === "allow" ? "(ran tool) " : "(skipped) " }] } };
      }
      for (const m of messages) yield m;
    }
    return Object.assign(gen(), { interrupt: async () => {} });
  };
}

const sys: SdkMessage = { type: "system", subtype: "init", session_id: "sess-123" };

describe("ClaudeCodeBridge", () => {
  it("captures session id, streams assistant text as tokens, emits result", async () => {
    const events: BrainEvent[] = [];
    const sessionIds: string[] = [];
    const bridge = new ClaudeCodeBridge(
      fakeQuery([
        sys,
        { type: "assistant", message: { content: [{ type: "text", text: "Working on it. " }] } },
        { type: "result", subtype: "success", result: "Done." },
      ]),
      (id) => sessionIds.push(id),
    );
    bridge.on((e) => events.push(e));
    bridge.start("do it", { cwd: "/repo" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
    expect(sessionIds).toContain("sess-123");
    expect(events.filter((e) => e.type === "token").map((e: any) => e.text).join("")).toContain("Working on it.");
    expect(events.find((e) => e.type === "result")).toMatchObject({ type: "result", text: "Done." });
  });

  it("emits a permission event and resolves allow via decide()", async () => {
    const events: BrainEvent[] = [];
    const bridge = new ClaudeCodeBridge(
      fakeQuery([{ type: "result", subtype: "success", result: "ok" }], { askTool: { name: "Bash", input: { command: "npm test" } } }),
      () => {},
    );
    bridge.on((e) => events.push(e));
    bridge.start("test the repo", { cwd: "/repo" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "permission")).toBe(true));
    const perm = events.find((e) => e.type === "permission") as any;
    expect(perm.tool).toBe("Bash");
    expect(perm.summary).toBe("Run: npm test");
    bridge.decide(perm.requestId, true);
    await vi.waitFor(() => expect(events.some((e) => e.type === "result")).toBe(true));
  });

  it("stop() denies any pending permission so nothing hangs", async () => {
    const events: BrainEvent[] = [];
    const bridge = new ClaudeCodeBridge(
      fakeQuery([{ type: "result", subtype: "success", result: "ok" }], { askTool: { name: "Bash", input: { command: "rm -rf /" } } }),
      () => {},
    );
    bridge.on((e) => events.push(e));
    bridge.start("x", { cwd: "/repo" });
    await vi.waitFor(() => expect(events.some((e) => e.type === "permission")).toBe(true));
    expect(() => bridge.stop()).not.toThrow();
  });
});
