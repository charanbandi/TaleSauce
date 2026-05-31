import { describe, it, expect } from "vitest";
import { encodeEvent, decodeEvent } from "./protocol.js";

describe("protocol", () => {
  it("round-trips a server event", () => {
    const e = { type: "token", agentId: "a1", text: "hi" } as const;
    expect(decodeEvent(encodeEvent(e))).toEqual(e);
  });
  it("returns null on malformed JSON", () => {
    expect(decodeEvent("{not json")).toBeNull();
  });
  it("returns null when type is missing", () => {
    expect(decodeEvent(JSON.stringify({ agentId: "a1" }))).toBeNull();
  });
});
