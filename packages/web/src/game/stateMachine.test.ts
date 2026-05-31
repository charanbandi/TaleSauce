import { describe, it, expect } from "vitest";
import { nextSpriteIntent } from "./stateMachine.js";

describe("nextSpriteIntent", () => {
  it("walks to workstation when working", () => {
    expect(nextSpriteIntent("working")).toEqual({ move: "workstation", anim: "work-loop", bubble: "thinking" });
  });
  it("walks to front and waves when awaiting user", () => {
    expect(nextSpriteIntent("awaiting-user")).toEqual({ move: "front", anim: "wave", bubble: "question" });
  });
  it("walks to front and reports", () => {
    expect(nextSpriteIntent("reporting")).toEqual({ move: "front", anim: "talk", bubble: "result" });
  });
  it("wanders when idle", () => {
    expect(nextSpriteIntent("idle")).toEqual({ move: "wander", anim: "idle", bubble: "none" });
  });
  it("shows alert bubble on error", () => {
    expect(nextSpriteIntent("error").bubble).toBe("alert");
  });
});
