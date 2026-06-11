import type { AgentConfig } from "@talesauce/shared";
import type { AgentBrain } from "./AgentBrain.js";
import { OpenClawBrain } from "./OpenClawBrain.js";
import { ClaudeCodeBrain } from "./ClaudeCodeBrain.js";
import { CliAgentBrain } from "./CliAgentBrain.js";
import type { QueryFn } from "./CodingAgentBridge.js";
import { Db } from "../db/db.js";
import type { Env } from "../env.js";

export function buildSystemPrompt(a: AgentConfig): string {
  const p = a.personality;
  return [
    `You are ${a.name}, a character in a small 8-bit world (the ${a.environment}).`,
    `Skill: ${p.skill}. Personality: ${p.personality}. Speaking style: ${p.speakingStyle}.`,
    `Stay in character, be warm and conversational. Write your reply as natural text —`,
    `it streams to the user word by word as you write, so put your actual response there.`,
    ``,
    `PROTOCOL (follow exactly):`,
    `- If you need clarification before you can continue, ask with a single line starting:`,
    `  ❓QUESTION: <your question>`,
    `- When you have finished, end with a single line starting:`,
    `  ✅DONE: <brief one-line recap>`,
    `- Your real response goes in the natural text ABOVE the ✅DONE line, not inside it.`,
  ].join("\n");
}

let realQuery: QueryFn | undefined;
async function loadRealQuery(): Promise<QueryFn> {
  if (!realQuery) {
    // @ts-ignore — package is installed at runtime only; may be absent at build time
    const sdk = await import("@anthropic-ai/claude-agent-sdk");
    realQuery = ((args: any) => (sdk as any).query(args)) as QueryFn;
  }
  return realQuery;
}

export function makeBrainFactory(db: Db, env: Env) {
  return (agent: AgentConfig): AgentBrain => {
    if (agent.brainKind === "claudecode") {
      const queryFn: QueryFn = (args) => {
        let inner: any;
        async function* gen() {
          const q = await loadRealQuery();
          inner = q(args);
          for await (const m of inner) yield m;
        }
        return Object.assign(gen(), { interrupt: async () => inner?.interrupt?.() });
      };
      return new ClaudeCodeBrain({
        cwd: agent.workingDir ?? "",
        sessionId: agent.sessionId,
        queryFn,
        onSession: (id) => db.updateAgent(agent.id, { sessionId: id }),
      });
    }

    if (agent.brainKind === "codex" || agent.brainKind === "cursor") {
      return new CliAgentBrain({
        kind: agent.brainKind,
        cwd: agent.workingDir ?? "",
        sessionId: agent.sessionId,
        model: agent.model || undefined,
        onSession: (id) => db.updateAgent(agent.id, { sessionId: id }),
      });
    }

    // openclaw (default)
    const history = db.listMessages(agent.id).map((m) => ({ role: m.role, content: m.content }));
    return new OpenClawBrain({
      url: env.openclawUrl, key: env.openclawKey,
      model: agent.model || env.taskModel, systemPrompt: buildSystemPrompt(agent), history,
    });
  };
}
