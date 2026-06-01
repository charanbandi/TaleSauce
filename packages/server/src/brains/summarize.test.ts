import { describe, it, expect } from "vitest";
import { summarize } from "./summarize.js";

describe("summarize", () => {
  it("summarizes Bash as the command", () => {
    expect(summarize("Bash", { command: "npm test" })).toBe("Run: npm test");
  });
  it("summarizes Edit/Write as the path", () => {
    expect(summarize("Edit", { file_path: "src/app.ts" })).toBe("Edit: src/app.ts");
    expect(summarize("Write", { file_path: "a/b.ts" })).toBe("Edit: a/b.ts");
  });
  it("falls back to the tool name", () => {
    expect(summarize("WebFetch", { url: "x" })).toBe("Use: WebFetch");
  });
  it("truncates very long commands", () => {
    const long = "echo " + "x".repeat(200);
    expect(summarize("Bash", { command: long }).length).toBeLessThanOrEqual(80);
  });
});
