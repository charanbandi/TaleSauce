export type BrainEvent =
  | { type: "token"; text: string }
  | { type: "state"; state: "working" | "needs-input" | "reporting" | "done" | "error" }
  | { type: "question"; text: string }
  | { type: "result"; text: string }
  | { type: "error"; message: string }
  | { type: "permission"; requestId: string; tool: string; summary: string }
  | { type: "tool-activity"; summary: string };

export type BrainListener = (e: BrainEvent) => void;

export interface AgentBrain {
  start(task: string): void;
  send(userReply: string): void;
  stop(): void;
  on(listener: BrainListener): void;
}
