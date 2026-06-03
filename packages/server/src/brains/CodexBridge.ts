import { StreamJsonCliBridge, type ParsedItem } from "./StreamJsonCliBridge.js";

function clip70(s: string): string {
  return s.length > 70 ? s.slice(0, 67) + "…" : s;
}

function summariseCliTool(tool: string, args: Record<string, unknown>): string {
  const cmd = typeof args.command === "string" ? args.command
             : typeof args.cmd === "string" ? args.cmd : "";
  const file = typeof args.file === "string" ? args.file
              : typeof args.path === "string" ? args.path
              : typeof args.file_path === "string" ? args.file_path : "";
  if (cmd) return clip70(`Run: ${cmd}`);
  if (file) return clip70(`Edit: ${file}`);
  return clip70(`Use: ${tool}`);
}

/**
 * Adapter for the Codex CLI (openai/codex).
 *
 * Spawn: `codex exec --json --sandbox workspace-write -C <cwd> [resume <sessionId>] "<task>"`
 *
 * Stream-JSON format (one object per line on stdout):
 *   {"type":"session","id":"thread_abc"}
 *   {"type":"text","text":"streamed text"}
 *   {"type":"tool_call","tool":"bash","args":{"command":"ls"},"id":"tc1"}
 *   {"type":"tool_result","call_id":"tc1","output":"..."}   (ignored)
 *   {"type":"done","result":"final text"}
 *
 * NOTE: If your installed codex version emits different keys, adjust parseLine()
 * and update CodexBridge.test.ts accordingly.
 */
export class CodexBridge extends StreamJsonCliBridge {
  get binary() { return "codex"; }

  buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[] {
    const args = ["exec", "--json", "--sandbox", "workspace-write", "-C", opts.cwd];
    if (opts.sessionId) args.push("resume", opts.sessionId);
    args.push(task);
    return args;
  }

  parseLine(obj: Record<string, unknown>): ParsedItem {
    if (obj.type === "session" && typeof obj.id === "string")
      return { kind: "session", id: obj.id };

    if (obj.type === "text" && typeof obj.text === "string")
      return { kind: "token", text: obj.text };

    if (obj.type === "tool_call") {
      const tool = typeof obj.tool === "string" ? obj.tool : "tool";
      const args = (typeof obj.args === "object" && obj.args !== null)
        ? obj.args as Record<string, unknown> : {};
      return { kind: "tool", summary: summariseCliTool(tool, args) };
    }

    if (obj.type === "tool_result")
      return { kind: "ignore" };

    if (obj.type === "done")
      return { kind: "result", text: typeof obj.result === "string" ? obj.result : undefined };

    return { kind: "ignore" };
  }
}
