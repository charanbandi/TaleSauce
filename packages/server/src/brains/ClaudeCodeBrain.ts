import type { AgentBrain, BrainListener, BrainEvent } from "./AgentBrain.js";

/** Phase 1: interface present, not wired. Real Agent-SDK bridge lands in Phase 2. */
export class ClaudeCodeBrain implements AgentBrain {
  private listeners: BrainListener[] = [];
  on(l: BrainListener) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }
  start() { this.emit({ type: "error", message: "Claude Code brain is available in Phase 2." }); }
  send() { /* no-op */ }
  stop() { /* no-op */ }
}
