import type { AgentBrain, BrainListener, BrainEvent } from "./AgentBrain.js";
import type { SpawnFn } from "./cliProcess.js";
import { CodexBridge } from "./CodexBridge.js";
import { CursorBridge } from "./CursorBridge.js";
import { StreamJsonCliBridge } from "./StreamJsonCliBridge.js";

export type CliBridgeKind = "codex" | "cursor";

export interface CliAgentBrainOpts {
  kind: CliBridgeKind;
  cwd: string;
  sessionId?: string;
  /** Injected for tests; defaults to real child_process.spawn. */
  spawnFn?: SpawnFn;
  onSession?: (id: string) => void;
}

/** Adapts a StreamJsonCliBridge to the AgentBrain interface (mirrors ClaudeCodeBrain). */
export class CliAgentBrain implements AgentBrain {
  private listeners: BrainListener[] = [];
  private bridge: StreamJsonCliBridge;
  sessionId?: string;

  constructor(private opts: CliAgentBrainOpts) {
    this.sessionId = opts.sessionId;
    const onSession = (id: string) => {
      this.sessionId = id;
      opts.onSession?.(id);
    };
    this.bridge = opts.kind === "codex"
      ? new CodexBridge(opts.spawnFn, onSession)
      : new CursorBridge(opts.spawnFn, onSession);
    this.bridge.on((e) => this.emit(e));
  }

  on(l: BrainListener) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }

  start(task: string) {
    if (!this.opts.cwd) {
      this.emit({ type: "error", message: `Set a working directory for this ${this.opts.kind} agent.` });
      this.emit({ type: "state", state: "error" });
      return;
    }
    this.bridge.start(task, { cwd: this.opts.cwd, sessionId: this.sessionId });
  }

  send(text: string) { this.bridge.reply(text); }

  /** No-op: sandboxed CLI brains have no interactive permission gate. */
  decide(_requestId: string, _allow: boolean) {}

  stop() { this.bridge.stop(); }
}
