import { createInterface } from "node:readline";
import type { BrainEvent } from "./AgentBrain.js";
import type { CodingAgentBridge } from "./CodingAgentBridge.js";
import { defaultSpawn } from "./cliProcess.js";
import type { SpawnFn, SpawnResult } from "./cliProcess.js";

export type ParsedItem =
  | { kind: "session"; id: string }
  | { kind: "token"; text: string }
  | { kind: "tool"; summary: string }
  | { kind: "result"; text?: string }
  | { kind: "error"; message: string }
  | { kind: "ignore" };

export abstract class StreamJsonCliBridge implements CodingAgentBridge {
  private listeners: ((e: BrainEvent) => void)[] = [];
  private child?: SpawnResult;
  private stopped = false;
  private resultSeen = false;
  private streamedThisTurn = false;
  private lastCwd = "";
  private sessionId?: string;

  constructor(
    protected spawnFn: SpawnFn = defaultSpawn,
    private onSession: (id: string) => void = () => {},
  ) {}

  /** Binary name, e.g. "codex" or "cursor-agent". */
  abstract get binary(): string;

  /** Return argv for a fresh spawn or resume. */
  abstract buildArgs(task: string, opts: { cwd: string; sessionId?: string }): string[];

  /** Normalise one parsed JSON line into a ParsedItem. */
  abstract parseLine(obj: Record<string, unknown>): ParsedItem;

  /** Expose sessionId for tests. */
  getSessionId(): string | undefined { return this.sessionId; }

  on(l: (e: BrainEvent) => void) { this.listeners.push(l); }
  private emit(e: BrainEvent) { for (const l of this.listeners) l(e); }

  start(task: string, opts: { cwd: string; sessionId?: string }) {
    this.lastCwd = opts.cwd;
    this.sessionId = opts.sessionId;
    this.reset();
    this.emit({ type: "state", state: "working" });
    this.doSpawn(task, opts);
  }

  reply(text: string) {
    this.reset();
    this.emit({ type: "state", state: "working" });
    this.doSpawn(text, { cwd: this.lastCwd, sessionId: this.sessionId });
  }

  /** No-op: sandboxed brains have no interactive permission gate. */
  decide(_requestId: string, _allow: boolean) {}

  stop() {
    this.stopped = true;
    this.child?.kill();
  }

  private reset() {
    this.stopped = false;
    this.resultSeen = false;
    this.streamedThisTurn = false;
  }

  private doSpawn(task: string, opts: { cwd: string; sessionId?: string }) {
    const args = this.buildArgs(task, opts);
    this.child = this.spawnFn(this.binary, args, { cwd: opts.cwd });

    const rl = createInterface({ input: this.child.stdout, crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (this.stopped) return;
      let obj: Record<string, unknown>;
      try { obj = JSON.parse(line) as Record<string, unknown>; }
      catch { return; }
      this.handle(this.parseLine(obj));
    });

    this.child.on("close", (code) => {
      if (this.stopped) return;
      if (!this.resultSeen) {
        this.emit({ type: "error", message: `${this.binary} exited (code ${code ?? "?"}) without a result.` });
        this.emit({ type: "state", state: "error" });
      }
    });
  }

  private handle(item: ParsedItem) {
    if (this.stopped) return;
    switch (item.kind) {
      case "session":
        this.sessionId = item.id;
        this.onSession(item.id);
        break;
      case "token":
        this.streamedThisTurn = true;
        this.emit({ type: "token", text: item.text });
        break;
      case "tool":
        this.emit({ type: "tool-activity", summary: item.summary });
        break;
      case "result":
        this.resultSeen = true;
        if (item.text && !this.streamedThisTurn) {
          this.emit({ type: "token", text: item.text });
        }
        this.streamedThisTurn = false;
        this.emit({ type: "state", state: "reporting" });
        this.emit({ type: "result", text: item.text ?? "Done." });
        this.emit({ type: "state", state: "done" });
        break;
      case "error":
        this.emit({ type: "error", message: item.message });
        this.emit({ type: "state", state: "error" });
        break;
      case "ignore":
        break;
    }
  }
}
