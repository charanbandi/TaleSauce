import type { Env } from "./env.js";

export interface Capabilities {
  openclaw: boolean;
  claudecode: boolean;
  defaultBrain: "openclaw" | "claudecode" | null;
}

export function detectCapabilities(env: Env): Capabilities {
  const openclaw = !!env.openclawUrl && !!env.openclawKey && env.openclawKey !== "replace_with_your_key";
  const claudecode = env.claudeCodeEnabled;
  const avail = { openclaw, claudecode };
  const defaultBrain = env.defaultBrain && avail[env.defaultBrain] ? env.defaultBrain : null;
  return { openclaw, claudecode, defaultBrain };
}
