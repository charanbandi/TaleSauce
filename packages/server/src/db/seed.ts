import { nanoid } from "nanoid";
import type { AgentConfig, BrainKind, Environment } from "@talesauce/shared";
import type { Capabilities } from "../capabilities.js";
import { Db } from "./db.js";

const starterPersonality = (skill: string, p: string) => ({
  skill, personality: p, speakingStyle: "Friendly and concise.",
  appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop",
});

const BRAIN_NAMES: Record<BrainKind, string> = {
  claudecode: "Kai",
  codex: "Rex",
  cursor: "Cass",
  openclaw: "Willow",
};

const BRAIN_PERSONALITIES: Record<BrainKind, ReturnType<typeof starterPersonality>> = {
  claudecode: starterPersonality("focused desk work", "Methodical, thinks in steps."),
  codex: starterPersonality("coding and refactoring", "Direct and efficient."),
  cursor: starterPersonality("code editing", "Sharp-eyed and detail-oriented."),
  openclaw: starterPersonality("home & lifestyle chores", "Warm and easygoing."),
};

function starterFor(brain: BrainKind): AgentConfig {
  const codingBrains: BrainKind[] = ["claudecode", "codex", "cursor"];
  const environment: Environment = codingBrains.includes(brain) ? "office" : "farm";
  return {
    id: nanoid(),
    name: BRAIN_NAMES[brain],
    environment,
    brainKind: brain,
    personality: BRAIN_PERSONALITIES[brain],
    pos: { x: 6, y: 6 },
  };
}

function pickBrain(caps: Capabilities): BrainKind | null {
  if (caps.defaultBrain) return caps.defaultBrain;
  const available: BrainKind[] = (["openclaw", "claudecode", "codex", "cursor"] as BrainKind[])
    .filter((k) => caps[k as keyof Capabilities] === true);
  return available.length === 1 ? available[0] : null;
}

/** Seed one starter agent on first run based on configured capabilities. No-op if agents exist. */
export function seedStarter(db: Db, caps: Capabilities): void {
  if (db.countAgents() > 0) return;
  const brain = pickBrain(caps);
  if (!brain) return;
  db.insertAgent(starterFor(brain));
}
