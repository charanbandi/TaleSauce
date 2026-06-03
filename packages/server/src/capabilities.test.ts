import { describe, it, expect } from "vitest";
import { detectCapabilities } from "./capabilities.js";
import type { Env } from "./env.js";

const baseEnv: Env = {
  openclawUrl: "", openclawKey: "", claudeCodeEnabled: false,
  codexEnabled: false, cursorEnabled: false,
  serverPort: 8787, dbPath: ":memory:",
};

const mockWhich = (available: string[]) => (cmd: string) => available.includes(cmd);

describe("detectCapabilities", () => {
  it("all false when nothing configured", () => {
    const caps = detectCapabilities(baseEnv, mockWhich([]));
    expect(caps).toEqual({ openclaw: false, claudecode: false, codex: false, cursor: false, defaultBrain: null });
  });

  it("openclaw requires url + non-placeholder key", () => {
    const env = { ...baseEnv, openclawUrl: "https://api.example.com", openclawKey: "real-key" };
    const caps = detectCapabilities(env, mockWhich([]));
    expect(caps.openclaw).toBe(true);
  });

  it("openclaw false when key is the placeholder", () => {
    const env = { ...baseEnv, openclawUrl: "https://api.example.com", openclawKey: "replace_with_your_key" };
    const caps = detectCapabilities(env, mockWhich([]));
    expect(caps.openclaw).toBe(false);
  });

  it("codex requires CODEX_ENABLED=true AND binary on PATH", () => {
    const env = { ...baseEnv, codexEnabled: true };
    expect(detectCapabilities(env, mockWhich([])).codex).toBe(false);
    expect(detectCapabilities(env, mockWhich(["codex"])).codex).toBe(true);
    expect(detectCapabilities({ ...baseEnv, codexEnabled: false }, mockWhich(["codex"])).codex).toBe(false);
  });

  it("cursor requires CURSOR_ENABLED=true AND binary on PATH", () => {
    const env = { ...baseEnv, cursorEnabled: true };
    expect(detectCapabilities(env, mockWhich([])).cursor).toBe(false);
    expect(detectCapabilities(env, mockWhich(["cursor-agent"])).cursor).toBe(true);
    expect(detectCapabilities({ ...baseEnv, cursorEnabled: false }, mockWhich(["cursor-agent"])).cursor).toBe(false);
  });

  it("defaultBrain from env when that brain is available", () => {
    const env = { ...baseEnv, codexEnabled: true, defaultBrain: "codex" as const };
    const caps = detectCapabilities(env, mockWhich(["codex"]));
    expect(caps.defaultBrain).toBe("codex");
  });

  it("defaultBrain null when named brain is not available", () => {
    const env = { ...baseEnv, defaultBrain: "codex" as const };
    const caps = detectCapabilities(env, mockWhich(["codex"]));
    expect(caps.defaultBrain).toBe(null);
  });
});
