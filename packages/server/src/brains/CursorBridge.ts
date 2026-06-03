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
 * Adapter for the Cursor agent CLI (cursor-agent).
 *
 * Spawn: `cursor-agent -p --output-format stream-json [--resume <sessionId>] "<task>"`
 *
 * Stream-JSON format (one object per line on stdout):
 *   {"type":"session","sessionId":"cursor_xyz"}
 *   {"type":"message","delta":"streamed text"}
 *   {"type":"tool","name":"codemod","args":{"file":"src/foo.ts"},"summary":"Edit: src/foo.ts"}
 *   {"type":"done","message":"final text"}
 *
 * NOTE: If your installed cursor-agent version emits different keys, adjust parseLine()
 * and update CursorBridge.test.ts accordingly.
 */
export class CursorBridge extends StreamJsonCliBridge {
  get binary() { return "cursor-agent"; }

  buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[] {
    const args = ["-p", "--output-format", "stream-json"];
    if (opts.sessionId) args.push("--resume", opts.sessionId);
    args.push(task);
    return args;
  }

  parseLine(obj: Record<string, unknown>): ParsedItem {
    if (obj.type === "session") {
      const id = typeof obj.sessionId === "string" ? obj.sessionId
                : typeof obj.id === "string" ? obj.id : undefined;
      if (id) return { kind: "session", id };
    }

    if (obj.type === "message" && typeof obj.delta === "string")
      return { kind: "token", text: obj.delta };

    if (obj.type === "tool") {
      const name = typeof obj.name === "string" ? obj.name : "tool";
      if (typeof obj.summary === "string") return { kind: "tool", summary: obj.summary };
      const args = (typeof obj.args === "object" && obj.args !== null)
        ? obj.args as Record<string, unknown> : {};
      return { kind: "tool", summary: summariseCliTool(name, args) };
    }

    if (obj.type === "done")
      return { kind: "result", text: typeof obj.message === "string" ? obj.message : undefined };

    return { kind: "ignore" };
  }
}
