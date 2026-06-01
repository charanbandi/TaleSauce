import { describe, it, expect } from "vitest";
import { detectCapabilities } from "./capabilities.js";
import type { Env } from "./env.js";

const base: Env = {
  openclawUrl: "", openclawKey: "", claudeCodeEnabled: false,
  serverPort: 8787, dbPath: ":memory:",
};

describe("detectCapabilities", () => {
  it("openclaw available only with url + real key", () => {
    expect(detectCapabilities({ ...base }).openclaw).toBe(false);
    expect(detectCapabilities({ ...base, openclawUrl: "u", openclawKey: "k" }).openclaw).toBe(true);
    expect(detectCapabilities({ ...base, openclawUrl: "u", openclawKey: "replace_with_your_key" }).openclaw).toBe(false);
  });
  it("claudecode follows claudeCodeEnabled", () => {
    expect(detectCapabilities({ ...base, claudeCodeEnabled: true }).claudecode).toBe(true);
    expect(detectCapabilities({ ...base }).claudecode).toBe(false);
  });
  it("defaultBrain only when set AND available", () => {
    expect(detectCapabilities({ ...base, claudeCodeEnabled: true, defaultBrain: "claudecode" }).defaultBrain).toBe("claudecode");
    expect(detectCapabilities({ ...base, defaultBrain: "claudecode" }).defaultBrain).toBeNull();
  });
});
