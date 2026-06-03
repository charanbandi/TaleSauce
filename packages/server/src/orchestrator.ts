import type { AgentConfig, AgentRuntime, AgentVisualState, ServerEvent } from "@talesauce/shared";
import type { AgentBrain, BrainEvent } from "./brains/AgentBrain.js";
import { Db } from "./db/db.js";

export type BrainFactory = (agent: AgentConfig) => AgentBrain;
type EventSink = (e: ServerEvent) => void;

interface PendingPerm { requestId: string; tool: string; summary: string; }
interface Live { brain: AgentBrain; runtime: AgentRuntime; perms: PendingPerm[]; }

export class Orchestrator {
  private live = new Map<string, Live>();
  private sinks: EventSink[] = [];

  constructor(private db: Db, private makeBrain: BrainFactory) {
    for (const cfg of db.listAgents()) {
      this.live.set(cfg.id, { brain: this.bind(cfg), runtime: { config: cfg, state: "idle", activity: "Hanging out" }, perms: [] });
    }
  }

  onEvent(sink: EventSink) { this.sinks.push(sink); }
  private emit(e: ServerEvent) { for (const s of this.sinks) s(e); }

  runtimes(): AgentRuntime[] { return [...this.live.values()].map((l) => l.runtime); }

  pendingPermissions(id: string): PendingPerm[] { return this.live.get(id)?.perms ?? []; }

  decide(agentId: string, requestId: string, allow: boolean) {
    const l = this.live.get(agentId);
    if (!l) return;
    l.perms = l.perms.filter((p) => p.requestId !== requestId);
    (l.brain as { decide?: (r: string, a: boolean) => void }).decide?.(requestId, allow);
    this.emit({ type: "permission-resolved", agentId, requestId });
    if (l.perms.length === 0) this.setState(agentId, "working", "Working: on it…");
  }

  updateAgentConfig(id: string, patch: { name?: string; brainKind?: "openclaw" | "claudecode"; model?: string; sessionId?: string; workingDir?: string }) {
    const l = this.live.get(id);
    if (!l) return;
    this.db.updateAgent(id, patch);
    const cfg = this.db.getAgent(id)!;
    l.runtime.config = cfg;
    l.brain = this.bind(cfg); // rebuild brain with the new config (e.g. switched kind / new cwd)
  }

  addAgent(cfg: AgentConfig): AgentRuntime {
    this.db.insertAgent(cfg);
    const runtime: AgentRuntime = { config: cfg, state: "idle", activity: "Settling in" };
    this.live.set(cfg.id, { brain: this.bind(cfg), runtime, perms: [] });
    this.emit({ type: "agent-added", agent: runtime });
    return runtime;
  }

  startTask(agentId: string, task: string) {
    const l = this.live.get(agentId);
    if (!l) return;
    this.db.insertMessage({ agentId, role: "user", content: task, kind: "task" });
    l.brain.start(task);
  }

  reply(agentId: string, text: string) {
    const l = this.live.get(agentId);
    if (!l) return;
    this.db.insertMessage({ agentId, role: "user", content: text, kind: "chat" });
    l.brain.send(text);
  }

  private setState(id: string, state: AgentVisualState, activity: string) {
    const l = this.live.get(id);
    if (!l) return;
    l.runtime.state = state;
    l.runtime.activity = activity;
    this.emit({ type: "agent-state", agentId: id, state, activity });
  }

  private bind(cfg: AgentConfig): AgentBrain {
    const brain = this.makeBrain(cfg);
    brain.on((e: BrainEvent) => this.handle(cfg.id, e));
    return brain;
  }

  private handle(id: string, e: BrainEvent) {
    switch (e.type) {
      case "state":
        if (e.state === "working") this.setState(id, "working", `Working: on it…`);
        break;
      case "token":
        this.emit({ type: "token", agentId: id, text: e.text });
        break;
      case "question":
        this.db.insertMessage({ agentId: id, role: "assistant", content: e.text, kind: "question" });
        this.setState(id, "walking-to-front", "Has a question for you");
        this.setState(id, "awaiting-user", "Waiting on your answer");
        this.emit({ type: "question", agentId: id, text: e.text });
        break;
      case "result":
        this.db.insertMessage({ agentId: id, role: "assistant", content: e.text, kind: "result" });
        this.setState(id, "reporting", "Reporting back");
        this.emit({ type: "result", agentId: id, text: e.text });
        this.setState(id, "idle", "Hanging out");
        break;
      case "error":
        this.emit({ type: "error", agentId: id, message: e.message });
        this.setState(id, "idle", "Took a breather (error)");
        break;
      case "tool-activity":
        this.setState(id, "working", e.summary);
        break;
      case "permission": {
        const l = this.live.get(id);
        if (l) l.perms.push({ requestId: e.requestId, tool: e.tool, summary: e.summary });
        this.setState(id, "awaiting-permission", `Asking: ${e.summary}`);
        this.emit({ type: "permission", agentId: id, requestId: e.requestId, tool: e.tool, summary: e.summary });
        break;
      }
    }
  }
}
