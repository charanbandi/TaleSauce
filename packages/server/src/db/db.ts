import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import type { AgentConfig } from "@talesauce/shared";
import { SCHEMA } from "./schema.js";

export interface MessageRow {
  id: string; agentId: string; role: string; content: string;
  kind: "chat" | "task" | "question" | "result"; createdAt: number;
}

export class Db {
  private db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA);
    this.migrate();
  }

  private migrate(): void {
    const cols = (this.db.prepare("PRAGMA table_info(agents)").all() as any[]).map((c) => c.name);
    if (!cols.includes("working_dir")) this.db.exec("ALTER TABLE agents ADD COLUMN working_dir TEXT");
  }

  listAgents(): AgentConfig[] {
    const rows = this.db.prepare("SELECT * FROM agents ORDER BY created_at").all() as any[];
    return rows.map(this.rowToAgent);
  }

  countAgents(): number {
    return (this.db.prepare("SELECT COUNT(*) n FROM agents").get() as any).n;
  }

  insertAgent(a: AgentConfig): void {
    this.db.prepare(
      `INSERT INTO agents (id,name,environment,brain_kind,model,session_id,working_dir,personality,pos_x,pos_y,created_at)
       VALUES (@id,@name,@environment,@brainKind,@model,@sessionId,@workingDir,@personality,@posX,@posY,@createdAt)`
    ).run({
      id: a.id, name: a.name, environment: a.environment, brainKind: a.brainKind,
      model: a.model ?? null, sessionId: a.sessionId ?? null, workingDir: a.workingDir ?? null,
      personality: JSON.stringify(a.personality), posX: a.pos.x, posY: a.pos.y,
      createdAt: Date.now(),
    });
  }

  updateAgent(id: string, patch: Partial<Pick<AgentConfig, "name" | "brainKind" | "model" | "sessionId" | "workingDir">>): void {
    const cur = this.getAgent(id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    this.db.prepare(
      `UPDATE agents SET name=@name, brain_kind=@brainKind, model=@model, session_id=@sessionId, working_dir=@workingDir WHERE id=@id`
    ).run({ id, name: next.name, brainKind: next.brainKind, model: next.model ?? null, sessionId: next.sessionId ?? null, workingDir: next.workingDir ?? null });
  }

  getAgent(id: string): AgentConfig | undefined {
    const row = this.db.prepare("SELECT * FROM agents WHERE id=?").get(id) as any;
    return row ? this.rowToAgent(row) : undefined;
  }

  deleteAgent(id: string): void {
    this.db.prepare("DELETE FROM messages WHERE agent_id=?").run(id);
    this.db.prepare("DELETE FROM agents WHERE id=?").run(id);
  }

  insertMessage(m: Omit<MessageRow, "id" | "createdAt">): MessageRow {
    const row: MessageRow = { ...m, id: nanoid(), createdAt: Date.now() };
    this.db.prepare(
      `INSERT INTO messages (id,agent_id,role,content,kind,created_at) VALUES (?,?,?,?,?,?)`
    ).run(row.id, row.agentId, row.role, row.content, row.kind, row.createdAt);
    return row;
  }

  listMessages(agentId: string, limit = 50): MessageRow[] {
    const rows = this.db.prepare(
      "SELECT id,agent_id agentId,role,content,kind,created_at createdAt FROM messages WHERE agent_id=? ORDER BY created_at ASC LIMIT ?"
    ).all(agentId, limit) as any[];
    return rows as MessageRow[];
  }

  getSettings(): { sliderPct: number; focus: string | null } {
    const row = this.db.prepare("SELECT data FROM settings WHERE id=1").get() as any;
    return row ? JSON.parse(row.data) : { sliderPct: 50, focus: null };
  }

  saveSettings(data: { sliderPct: number; focus: string | null }): void {
    this.db.prepare("INSERT INTO settings (id,data) VALUES (1,@d) ON CONFLICT(id) DO UPDATE SET data=@d")
      .run({ d: JSON.stringify(data) });
  }

  private rowToAgent = (r: any): AgentConfig => ({
    id: r.id, name: r.name, environment: r.environment, brainKind: r.brain_kind,
    model: r.model ?? undefined, sessionId: r.session_id ?? undefined,
    workingDir: r.working_dir ?? undefined,
    personality: JSON.parse(r.personality), pos: { x: r.pos_x, y: r.pos_y },
  });
}
