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
