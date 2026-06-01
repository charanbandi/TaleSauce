import { describe, it, expect } from "vitest";
import { Db } from "./db.js";
import { seedStarter } from "./seed.js";
import type { Capabilities } from "../capabilities.js";

const caps = (o: Partial<Capabilities>): Capabilities => ({ openclaw: false, claudecode: false, defaultBrain: null, ...o });

describe("seedStarter", () => {
  it("seeds nothing when no brain is available", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({}));
    expect(db.countAgents()).toBe(0);
  });
  it("seeds one openclaw farm agent when only openclaw", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({ openclaw: true }));
    expect(db.countAgents()).toBe(1);
    expect(db.listAgents()[0].brainKind).toBe("openclaw");
    expect(db.listAgents()[0].environment).toBe("farm");
  });
  it("seeds one claudecode office agent when only claudecode", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({ claudecode: true }));
    expect(db.listAgents()[0].brainKind).toBe("claudecode");
    expect(db.listAgents()[0].environment).toBe("office");
  });
  it("uses defaultBrain when both available", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({ openclaw: true, claudecode: true, defaultBrain: "claudecode" }));
    expect(db.listAgents()[0].brainKind).toBe("claudecode");
  });
  it("seeds nothing when both available and no defaultBrain", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({ openclaw: true, claudecode: true }));
    expect(db.countAgents()).toBe(0);
  });
  it("never seeds when agents already exist", () => {
    const db = new Db(":memory:");
    seedStarter(db, caps({ openclaw: true }));
    seedStarter(db, caps({ openclaw: true }));
    expect(db.countAgents()).toBe(1);
  });
});
