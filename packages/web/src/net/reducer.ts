import type { AgentRuntime, ServerEvent } from "@talesauce/shared";

export interface ChatMessage { role: "user" | "assistant"; kind: "chat" | "task" | "question" | "result"; content: string; }

export interface AppState {
  agents: Record<string, AgentRuntime>;
  chat: Record<string, string>;          // live streaming buffer per agent
  messages: Record<string, ChatMessage[]>;
}

export function initialState(): AppState {
  return { agents: {}, chat: {}, messages: {} };
}

export function applyEvent(s: AppState, e: ServerEvent): AppState {
  switch (e.type) {
    case "hello": {
      const agents: Record<string, AgentRuntime> = {};
      const messages = { ...s.messages };
      for (const a of e.agents) { agents[a.config.id] = a; messages[a.config.id] ??= []; }
      return { ...s, agents, messages };
    }
    case "agent-added":
      return { ...s, agents: { ...s.agents, [e.agent.config.id]: e.agent }, messages: { ...s.messages, [e.agent.config.id]: s.messages[e.agent.config.id] ?? [] } };
    case "agent-state": {
      const a = s.agents[e.agentId]; if (!a) return s;
      return { ...s, agents: { ...s.agents, [e.agentId]: { ...a, state: e.state, activity: e.activity } } };
    }
    case "token":
      return { ...s, chat: { ...s.chat, [e.agentId]: (s.chat[e.agentId] ?? "") + e.text } };
    case "question":
      return pushMsg(clearChat(s, e.agentId), e.agentId, { role: "assistant", kind: "question", content: e.text });
    case "result":
      return pushMsg(clearChat(s, e.agentId), e.agentId, { role: "assistant", kind: "result", content: e.text });
    case "error":
      return pushMsg(clearChat(s, e.agentId), e.agentId, { role: "assistant", kind: "result", content: "⚠️ " + e.message });
    default:
      return s;
  }
}

function clearChat(s: AppState, id: string): AppState {
  return { ...s, chat: { ...s.chat, [id]: "" } };
}
function pushMsg(s: AppState, id: string, m: ChatMessage): AppState {
  return { ...s, messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), m] } };
}
