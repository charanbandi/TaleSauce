import { StreamJsonCliBridge, type ParsedItem } from "./StreamJsonCliBridge.js";

function clip(s: string, n = 70): string {
  return s.length > n ? s.slice(0, n - 3) + "…" : s;
}

/** Pull assistant text out of a Cursor message: { content: [{ type:"text", text }] }. */
function assistantText(obj: Record<string, unknown>): string {
  const msg = (typeof obj.message === "object" && obj.message) ? obj.message as Record<string, unknown> : {};
  const content = Array.isArray(msg.content) ? msg.content : [];
  let out = "";
  for (const part of content) {
    const p = part as Record<string, unknown>;
    if (p && p.type === "text" && typeof p.text === "string") out += p.text;
  }
  return out;
}

/** Summarise a Cursor tool_call: { tool_call: { <someToolCall>: { args: {...} } } }. */
function summariseToolCall(toolCall: Record<string, unknown>): string {
  const key = Object.keys(toolCall)[0] ?? "tool";
  const inner = (typeof toolCall[key] === "object" && toolCall[key]) ? toolCall[key] as Record<string, unknown> : {};
  const args = (typeof inner.args === "object" && inner.args) ? inner.args as Record<string, unknown> : {};
  const name = key.replace(/ToolCall$/i, "");
  const cmd = typeof args.command === "string" ? args.command
             : typeof args.cmd === "string" ? args.cmd : "";
  const path = typeof args.path === "string" ? args.path
              : typeof args.file_path === "string" ? args.file_path
              : typeof args.file === "string" ? args.file : "";
  if (cmd) return clip(`Run: ${cmd}`);
  if (path) return clip(`${/read/i.test(name) ? "Read" : "Edit"}: ${path}`);
  return clip(`Use: ${name}`);
}

/**
 * Adapter for the Cursor agent CLI (`cursor-agent`).
 *
 * Spawn: cursor-agent -p --output-format stream-json [--model M] [--resume <sessionId>] "<task>"
 *
 * Stream-JSON events, per https://cursor.com/docs/cli/reference/output-format :
 *   {"type":"system","subtype":"init","session_id":"...","model":"...","cwd":"..."}
 *   {"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"..."}]},"session_id":"..."}
 *   {"type":"tool_call","subtype":"started","tool_call":{"readToolCall":{"args":{"path":"x"}}}}
 *   {"type":"result","subtype":"success","result":"final text","session_id":"...","is_error":false}
 */
export class CursorBridge extends StreamJsonCliBridge {
  get binary() { return "cursor-agent"; }

  buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[] {
    const args = ["-p", "--output-format", "stream-json"];
    if (this.model) args.push("--model", this.model);
    if (opts.sessionId) args.push("--resume", opts.sessionId);
    args.push(task);
    return args;
  }

  parseLine(obj: Record<string, unknown>): ParsedItem {
    const type = obj.type;

    if (type === "system" && obj.subtype === "init" && typeof obj.session_id === "string")
      return { kind: "session", id: obj.session_id };

    if (type === "assistant") {
      const text = assistantText(obj);
      return text ? { kind: "token", text } : { kind: "ignore" };
    }

    if (type === "tool_call" && obj.subtype === "started") {
      const tc = (typeof obj.tool_call === "object" && obj.tool_call) ? obj.tool_call as Record<string, unknown> : {};
      return { kind: "tool", summary: summariseToolCall(tc) };
    }

    if (type === "result") {
      if (obj.is_error === true || (typeof obj.subtype === "string" && obj.subtype !== "success"))
        return { kind: "error", message: typeof obj.result === "string" ? obj.result : "Cursor agent failed." };
      return { kind: "result", text: typeof obj.result === "string" ? obj.result : undefined };
    }

    return { kind: "ignore" };
  }
}
