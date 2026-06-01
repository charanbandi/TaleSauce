import { describe, it, expect } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("uses defaults when optional vars absent", () => {
    const e = loadEnv({ OPENCLAW_API_URL: "u", OPENCLAW_API_KEY: "k" });
    expect(e.serverPort).toBe(8787);
    expect(e.dbPath).toBe("./talesauce.sqlite");
    expect(e.openclawUrl).toBe("u");
  });
  it("returns empty openclaw fields when unset (capabilities decides availability)", () => {
    const e = loadEnv({});
    expect(e.openclawUrl).toBe("");
    expect(e.openclawKey).toBe("");
    expect(e.claudeCodeEnabled).toBe(false);
  });
  it("claudeCodeEnabled true when ANTHROPIC_API_KEY set", () => {
    expect(loadEnv({ ANTHROPIC_API_KEY: "sk-x" }).claudeCodeEnabled).toBe(true);
  });
  it("throws on invalid SERVER_PORT", () => {
    expect(() =>
      loadEnv({ OPENCLAW_API_URL: "u", OPENCLAW_API_KEY: "k", SERVER_PORT: "banana" }),
    ).toThrow(/SERVER_PORT/);
  });
});
