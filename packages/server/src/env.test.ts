import { describe, it, expect } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("uses defaults when optional vars absent", () => {
    const e = loadEnv({ OPENCLAW_API_URL: "u", OPENCLAW_API_KEY: "k" });
    expect(e.serverPort).toBe(8787);
    expect(e.dbPath).toBe("./talesauce.sqlite");
    expect(e.openclawUrl).toBe("u");
  });
  it("throws when required key missing", () => {
    expect(() => loadEnv({ OPENCLAW_API_URL: "u" })).toThrow(/OPENCLAW_API_KEY/);
  });
});
