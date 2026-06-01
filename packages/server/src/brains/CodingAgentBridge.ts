import type { BrainEvent } from "./AgentBrain.js";

/** What a local coding-agent CLI bridge must implement (Claude Code now; Codex/Cursor later). */
export interface CodingAgentBridge {
  start(task: string, opts: { cwd: string; sessionId?: string }): void;
  reply(text: string): void;
  decide(requestId: string, allow: boolean): void;
  stop(): void;
  on(listener: (e: BrainEvent) => void): void;
}

/** Minimal shape of the Agent SDK messages we consume (loose on purpose; real SDK has more). */
export interface SdkMessage {
  type: string;
  subtype?: string;
  session_id?: string;
  message?: { content?: Array<{ type: string; text?: string }> };
  result?: string;
  event?: { type?: string; delta?: { type?: string; text?: string } };
}

export interface PermissionResult {
  behavior: "allow" | "deny";
  message?: string;
  interrupt?: boolean;
}

/** The subset of the SDK `query()` we depend on — injected so the bridge is testable. */
export interface SdkQuery extends AsyncIterable<SdkMessage> {
  interrupt?: () => Promise<void>;
}
export type QueryFn = (args: {
  prompt: AsyncIterable<unknown> | string;
  options: Record<string, unknown>;
}) => SdkQuery;

export type CanUseTool = (
  toolName: string,
  input: Record<string, unknown>,
) => Promise<PermissionResult>;
