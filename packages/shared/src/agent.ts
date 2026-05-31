export type Environment = "farm" | "office";
export type BrainKind = "openclaw" | "claudecode";

/** Visual states the orchestrator can put an agent in; the client renders them. */
export type AgentVisualState =
  | "idle"
  | "going-to-workstation"
  | "working"
  | "walking-to-front"
  | "awaiting-user"
  | "reporting"
  | "error";

export interface AgentConfig {
  id: string;
  name: string;
  environment: Environment;
  brainKind: BrainKind;
  /** OpenClaw model override for tasks; falls back to env default. */
  model?: string;
  /** Claude Code session id (Phase 2; unused in Phase 1). */
  sessionId?: string;
  personality: {
    skill: string;
    personality: string;
    speakingStyle: string;
    appearance: string;
    idleActions: string[];
    workAnimation: string;
  };
  pos: { x: number; y: number };
}

export interface AgentRuntime {
  config: AgentConfig;
  state: AgentVisualState;
  /** One-line "current activity" for the task dock. */
  activity: string;
}
