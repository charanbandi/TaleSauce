import { nanoid } from "nanoid";
import type { AgentConfig, BrainKind, Environment } from "@talesauce/shared";
import type { Capabilities } from "../capabilities.js";
import { Db } from "./db.js";

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: "willow-farm",
    name: "Willow",
    environment: "farm",
    brainKind: "openclaw",
    personality: {
      skill: "home & lifestyle chores",
      personality: "Warm, easygoing, hums while working. Loves plants and slow mornings.",
      speakingStyle: "Gentle and friendly. 'Sure thing — give me a sec to think it through.'",
      appearance: "Straw hat, overalls, freckles, dirt-smudged knees.",
      idleActions: ["water", "dig", "shower", "swim", "watch", "sleep", "stroll"],
      workAnimation: "water",
    },
    pos: { x: 8, y: 8 },
  },
  {
    id: "kai-office",
    name: "Kai",
    environment: "office",
    brainKind: "openclaw",
    personality: {
      skill: "focused desk work",
      personality: "Methodical, calm, thinks in steps. Quietly competitive about clean output.",
      speakingStyle: "Concise and structured. 'Let me break that into steps.'",
      appearance: "Hoodie, headphones, glasses, travel mug always nearby.",
      idleActions: ["type", "watch", "wander", "coffee", "couch"],
      workAnimation: "type",
    },
    pos: { x: 6, y: 6 },
  },
];

export function seedIfEmpty(db: Db): void {
  if (db.countAgents() === 0) {
    for (const a of DEFAULT_AGENTS) db.insertAgent(a);
  }
}

const starterPersonality = (skill: string, p: string) => ({
  skill, personality: p, speakingStyle: "Friendly and concise.",
  appearance: "default", idleActions: ["stroll"], workAnimation: "work-loop",
});

function starterFor(brain: BrainKind): AgentConfig {
  const environment: Environment = brain === "claudecode" ? "office" : "farm";
  return {
    id: nanoid(),
    name: brain === "claudecode" ? "Kai" : "Willow",
    environment, brainKind: brain,
    personality: brain === "claudecode"
      ? starterPersonality("focused desk work", "Methodical, thinks in steps.")
      : starterPersonality("home & lifestyle chores", "Warm and easygoing."),
    pos: { x: 6, y: 6 },
  };
}

function pickBrain(caps: Capabilities): BrainKind | null {
  if (caps.defaultBrain) return caps.defaultBrain;
  if (caps.openclaw && !caps.claudecode) return "openclaw";
  if (caps.claudecode && !caps.openclaw) return "claudecode";
  return null;
}

/** Seed one starter agent on first run based on configured capabilities. No-op if agents exist. */
export function seedStarter(db: Db, caps: Capabilities): void {
  if (db.countAgents() > 0) return;
  const brain = pickBrain(caps);
  if (!brain) return;
  db.insertAgent(starterFor(brain));
}
