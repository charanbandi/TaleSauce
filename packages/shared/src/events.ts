import type { AgentRuntime, AgentVisualState } from "./agent.js";

/** Server → client over WebSocket. Server is authoritative. */
export type ServerEvent =
  | { type: "hello"; agents: AgentRuntime[] }
  | { type: "agent-state"; agentId: string; state: AgentVisualState; activity: string }
  | { type: "token"; agentId: string; text: string }
  | { type: "question"; agentId: string; text: string }
  | { type: "result"; agentId: string; text: string }
  | { type: "agent-added"; agent: AgentRuntime }
  | { type: "error"; agentId: string; message: string };

/** Client → server over WebSocket (commands also available via REST). */
export type ClientCommand =
  | { type: "subscribe" };
