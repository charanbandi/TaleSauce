import { execSync } from "node:child_process";
import type { Env } from "./env.js";

export interface Capabilities {
  openclaw: boolean;
  claudecode: boolean;
  codex: boolean;
  cursor: boolean;
  defaultBrain: "openclaw" | "claudecode" | "codex" | "cursor" | null;
}

/** Injected for tests so detection doesn't hit the real filesystem. */
export type WhichFn = (cmd: string) => boolean;

export const defaultWhich: WhichFn = (cmd) => {
  try { execSync(`which ${cmd}`, { stdio: "ignore" }); return true; } catch { return false; }
};

export function detectCapabilities(env: Env, which: WhichFn = defaultWhich): Capabilities {
  const openclaw = !!env.openclawUrl && !!env.openclawKey && env.openclawKey !== "replace_with_your_key";
  const claudecode = env.claudeCodeEnabled;
  const codex = env.codexEnabled && which("codex");
  const cursor = env.cursorEnabled && which("cursor-agent");
  const avail: Record<string, boolean> = { openclaw, claudecode, codex, cursor };
  const defaultBrain = env.defaultBrain && avail[env.defaultBrain]
    ? env.defaultBrain as Capabilities["defaultBrain"]
    : null;
  return { openclaw, claudecode, codex, cursor, defaultBrain };
}
