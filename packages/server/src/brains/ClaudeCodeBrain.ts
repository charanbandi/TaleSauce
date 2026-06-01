import type { AgentBrain, BrainListener, BrainEvent } from "./AgentBrain.js";
import type { QueryFn } from "./CodingAgentBridge.js";
import { ClaudeCodeBridge } from "./ClaudeCodeBridge.js";

export interface ClaudeCodeBrainOpts {
  cwd: string;
  sessionId?: string;
  queryFn: QueryFn;
  onSession?: (id: string) => void;
}

/** Adapts the CodingAgentBridge to the AgentBrain interface used by the orchestrator. */
export class ClaudeCodeBrain implements AgentBrain {
  private listeners: BrainListener[] = [];
  private bridge: ClaudeCodeBridge;
  sessionId?: string;

  constructor(private opts: ClaudeCodeBrainOpts) {
    this.sessionId = opts.sessionId;
    this.bridge = new ClaudeCodeBridge(opts.queryFn, (id) => {
      this.sessionId = id;
      opts.onSession?.(id);
    });
    this.bridge.on((e) => this.emit(e));
  }

  on(l: BrainListener) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }

  start(task: string) {
    if (!this.opts.cwd) {
      this.emit({ type: "error", message: "Set a working directory for this Claude Code agent." });
      this.emit({ type: "state", state: "error" });
      return;
    }
    this.bridge.start(task, { cwd: this.opts.cwd, sessionId: this.sessionId });
  }
  send(text: string) { this.bridge.reply(text); }
  /** Permission decisions are routed here by the orchestrator. */
  decide(requestId: string, allow: boolean) { this.bridge.decide(requestId, allow); }
  stop() { this.bridge.stop(); }
}
