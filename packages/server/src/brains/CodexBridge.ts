import { StreamJsonCliBridge, type ParsedItem } from "./StreamJsonCliBridge.js";

function clip(s: string, n = 70): string {
  return s.length > n ? s.slice(0, n - 3) + "…" : s;
}

/** Summarise a Codex item (command_execution / file_change / mcp_tool_call / web_search). */
function summariseItem(item: Record<string, unknown>): string {
  const type = String(item.type ?? "tool");
  if (typeof item.command === "string") return clip(`Run: ${item.command}`);
  if (type === "file_change") {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    const first = changes[0] as Record<string, unknown> | undefined;
    const path = first && typeof first.path === "string" ? first.path : "";
    return clip(path ? `Edit: ${path}` : `Editing ${changes.length || ""} file(s)`.trim());
  }
  if (type === "mcp_tool_call") {
    const tool = typeof item.tool === "string" ? item.tool
                : typeof item.name === "string" ? item.name : "tool";
    return clip(`Use: ${tool}`);
  }
  if (type === "web_search") {
    const q = typeof item.query === "string" ? item.query : "";
    return clip(q ? `Search: ${q}` : "Searching the web");
  }
  return clip(`Use: ${type}`);
}

/**
 * Adapter for the OpenAI Codex CLI (`codex`).
 *
 * Spawn (fresh):  codex exec --json --sandbox workspace-write -C <cwd> [--model M] "<task>"
 * Spawn (resume): codex exec resume <sessionId> --json --sandbox workspace-write -C <cwd> [--model M] "<task>"
 *
 * Stream-JSON events (one object per line on stdout), per
 * https://developers.openai.com/codex/noninteractive :
 *   {"type":"thread.started","thread_id":"..."}
 *   {"type":"turn.started"}
 *   {"type":"item.started","item":{"type":"command_execution","command":"bash -lc ls",...}}
 *   {"type":"item.completed","item":{"type":"agent_message","text":"final answer"}}
 *   {"type":"turn.completed","usage":{...}}
 *   {"type":"error","message":"..."}  |  {"type":"turn.failed","error":{"message":"..."}}
 *
 * Codex delivers assistant text once (in item.completed), not as deltas, so we
 * remember the last agent_message and attach it to the turn.completed result.
 */
export class CodexBridge extends StreamJsonCliBridge {
  private lastText = "";

  get binary() { return "codex"; }

  buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[] {
    const args = ["exec"];
    if (opts.sessionId) args.push("resume", opts.sessionId);
    args.push("--json", "--sandbox", "workspace-write", "-C", opts.cwd);
    if (this.model) args.push("--model", this.model);
    args.push(task);
    return args;
  }

  parseLine(obj: Record<string, unknown>): ParsedItem {
    const type = obj.type;

    if (type === "thread.started" && typeof obj.thread_id === "string")
      return { kind: "session", id: obj.thread_id };

    if (type === "turn.started") { this.lastText = ""; return { kind: "ignore" }; }

    if (type === "item.started" || type === "item.completed") {
      const item = (typeof obj.item === "object" && obj.item) ? obj.item as Record<string, unknown> : {};
      const itype = item.type;
      if (type === "item.completed" && itype === "agent_message" && typeof item.text === "string") {
        this.lastText = item.text;
        return { kind: "token", text: item.text };
      }
      if (type === "item.started" &&
          (itype === "command_execution" || itype === "file_change" || itype === "mcp_tool_call" || itype === "web_search"))
        return { kind: "tool", summary: summariseItem(item) };
      return { kind: "ignore" };
    }

    if (type === "turn.completed") {
      const text = this.lastText || undefined;
      this.lastText = "";
      return { kind: "result", text };
    }

    if (type === "turn.failed") {
      const err = (typeof obj.error === "object" && obj.error) ? obj.error as Record<string, unknown> : {};
      return { kind: "error", message: typeof err.message === "string" ? err.message : "Codex turn failed." };
    }

    if (type === "error")
      return { kind: "error", message: typeof obj.message === "string" ? obj.message : "Codex error." };

    return { kind: "ignore" };
  }
}
