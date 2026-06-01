import { nanoid } from "nanoid";
import { summarize } from "./summarize.js";
import type {
  CodingAgentBridge, SdkMessage, QueryFn, SdkQuery, PermissionResult,
} from "./CodingAgentBridge.js";
import type { BrainEvent } from "./AgentBrain.js";

/** A simple async queue used as the streaming-input prompt for query(). */
class InputQueue {
  private items: unknown[] = [];
  private resolvers: ((v: IteratorResult<unknown>) => void)[] = [];
  private closed = false;
  push(item: unknown) {
    const r = this.resolvers.shift();
    if (r) r({ value: item, done: false });
    else this.items.push(item);
  }
  close() {
    this.closed = true;
    let r; while ((r = this.resolvers.shift())) r({ value: undefined, done: true });
  }
  stream(): AsyncIterable<unknown> {
    const self = this;
    return {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<unknown>> {
            if (self.items.length) return Promise.resolve({ value: self.items.shift()!, done: false });
            if (self.closed) return Promise.resolve({ value: undefined, done: true });
            return new Promise((res) => self.resolvers.push(res));
          },
        };
      },
    };
  }
}

const userMsg = (content: string) => ({ type: "user", message: { role: "user", content } });

export type SessionListener = (sessionId: string) => void;

export class ClaudeCodeBridge implements CodingAgentBridge {
  private listeners: ((e: BrainEvent) => void)[] = [];
  private input = new InputQueue();
  private pending = new Map<string, (r: PermissionResult) => void>();
  private q?: SdkQuery;
  private stopped = false;

  constructor(private queryFn: QueryFn, private onSession: SessionListener = () => {}) {}

  on(l: (e: BrainEvent) => void) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }

  start(task: string, opts: { cwd: string; sessionId?: string }) {
    this.emit({ type: "state", state: "working" });
    this.q = this.queryFn({
      prompt: this.input.stream(),
      options: {
        cwd: opts.cwd,
        resume: opts.sessionId,
        includePartialMessages: true,
        permissionMode: "default",
        allowedTools: ["Read", "Grep", "Glob", "LS"],
        canUseTool: this.onCanUseTool,
      },
    });
    this.input.push(userMsg(task));
    this.pump();
  }

  reply(text: string) { this.input.push(userMsg(text)); }

  decide(requestId: string, allow: boolean) {
    const resolve = this.pending.get(requestId);
    if (!resolve) return;
    this.pending.delete(requestId);
    resolve(allow ? { behavior: "allow" } : { behavior: "deny", message: "Denied by user", interrupt: false });
  }

  stop() {
    this.stopped = true;
    this.input.close();
    this.q?.interrupt?.();
    for (const [, resolve] of this.pending) resolve({ behavior: "deny", message: "Stopped", interrupt: true });
    this.pending.clear();
  }

  private onCanUseTool = (toolName: string, input: Record<string, unknown>): Promise<PermissionResult> =>
    new Promise<PermissionResult>((resolve) => {
      if (this.stopped) return resolve({ behavior: "deny", interrupt: true });
      const requestId = nanoid();
      this.pending.set(requestId, resolve);
      this.emit({ type: "permission", requestId, tool: toolName, summary: summarize(toolName, input) });
    });

  private async pump() {
    if (!this.q) return;
    try {
      for await (const msg of this.q) this.handle(msg);
    } catch {
      if (!this.stopped) { this.emit({ type: "error", message: "Claude Code session error." }); this.emit({ type: "state", state: "error" }); }
    }
  }

  private handle(msg: SdkMessage) {
    if (msg.type === "system" && msg.session_id) { this.onSession(msg.session_id); return; }
    if (msg.type === "stream_event") {
      const d = msg.event?.delta;
      if (msg.event?.type === "content_block_delta" && d?.type === "text_delta" && d.text) this.emit({ type: "token", text: d.text });
      return;
    }
    if (msg.type === "assistant") {
      const text = (msg.message?.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
      if (text) this.emit({ type: "token", text });
      return;
    }
    if (msg.type === "result") {
      this.emit({ type: "state", state: "reporting" });
      this.emit({ type: "result", text: msg.result ?? "Done." });
      this.emit({ type: "state", state: "done" });
      return;
    }
  }
}
