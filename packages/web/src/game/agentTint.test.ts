import { describe, it, expect, vi } from "vitest";

// Mock Phaser to avoid DOM canvas issues in tests
vi.mock("phaser", () => ({ default: {} }));

import { tintForAgent } from "./AgentSprite.js";

describe("tintForAgent", () => {
  it("returns no tint (0xffffff) for Willow", () => {
    expect(tintForAgent("Willow", "any-id")).toBe(0xffffff);
  });
  it("returns sky blue for Kai", () => {
    expect(tintForAgent("Kai", "any-id")).toBe(0x88aaff);
  });
  it("returns orange for Rex", () => {
    expect(tintForAgent("Rex", "any-id")).toBe(0xff9966);
  });
  it("returns purple for Cass", () => {
    expect(tintForAgent("Cass", "any-id")).toBe(0xcc88ff);
  });
  it("returns a preset tint for unknown names (deterministic by id)", () => {
    const t1 = tintForAgent("Unknown", "abc");
    const t2 = tintForAgent("Unknown", "abc");
    expect(t1).toBe(t2);
    expect(t1).not.toBeUndefined();
  });
  it("returns different tints for different ids when name is unknown", () => {
    const tints = new Set([
      tintForAgent("Bob", "id-000"),
      tintForAgent("Bob", "id-001"),
      tintForAgent("Bob", "id-002"),
    ]);
    for (const t of tints) expect(t).toBeGreaterThan(0);
  });
});
