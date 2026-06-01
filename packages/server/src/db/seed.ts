import { nanoid } from "nanoid";
import type { AgentConfig, BrainKind, Environment } from "@talesauce/shared";
import type { Capabilities } from "../capabilities.js";
import { Db } from "./db.js";

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
