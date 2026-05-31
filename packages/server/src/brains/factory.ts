import type { AgentConfig } from "@talesauce/shared";
import type { AgentBrain } from "./AgentBrain.js";
import { OpenClawBrain } from "./OpenClawBrain.js";
import { ClaudeCodeBrain } from "./ClaudeCodeBrain.js";
import { Db } from "../db/db.js";
import type { Env } from "../env.js";

export function buildSystemPrompt(a: AgentConfig): string {
  const p = a.personality;
  return [
    `You are ${a.name}, a character in a small 8-bit world (the ${a.environment}).`,
    `Skill: ${p.skill}. Personality: ${p.personality}. Speaking style: ${p.speakingStyle}.`,
    `Stay in character, be concise and friendly.`,
    ``,
    `PROTOCOL (follow exactly):`,
    `- If you need clarification before you can finish, reply with a single line starting:`,
    `  ❓QUESTION: <your question>`,
    `- When the task is complete, end your reply with a single line starting:`,
    `  ✅DONE: <one or two sentence summary of what you did>`,
    `- Otherwise just narrate your progress briefly.`,
  ].join("\n");
}

export function makeBrainFactory(db: Db, env: Env) {
  return (agent: AgentConfig): AgentBrain => {
    if (agent.brainKind === "claudecode") return new ClaudeCodeBrain();
    const history = db.listMessages(agent.id).map((m) => ({ role: m.role, content: m.content }));
    return new OpenClawBrain({
      url: env.openclawUrl,
      key: env.openclawKey,
      model: agent.model || env.taskModel,
      systemPrompt: buildSystemPrompt(agent),
      history,
    });
  };
}
