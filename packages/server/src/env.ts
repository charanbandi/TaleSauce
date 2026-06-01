export interface Env {
  openclawUrl: string;
  openclawKey: string;
  taskModel?: string;
  idleModel?: string;
  anthropicKey?: string;
  claudeCodeEnabled: boolean;
  defaultBrain?: "openclaw" | "claudecode";
  serverPort: number;
  dbPath: string;
}

function parsePort(raw: string | undefined): number {
  const p = Number(raw ?? 8787);
  if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error(`Invalid SERVER_PORT: "${raw}"`);
  return p;
}

export function loadEnv(src: NodeJS.ProcessEnv = process.env): Env {
  const rawDefault = src.DEFAULT_BRAIN;
  return {
    openclawUrl: src.OPENCLAW_API_URL ?? "",
    openclawKey: src.OPENCLAW_API_KEY ?? "",
    taskModel: src.OPENCLAW_TASK_MODEL || undefined,
    idleModel: src.OPENCLAW_IDLE_MODEL || undefined,
    anthropicKey: src.ANTHROPIC_API_KEY || undefined,
    claudeCodeEnabled: src.CLAUDE_CODE_ENABLED === "true" || !!src.ANTHROPIC_API_KEY,
    defaultBrain: rawDefault === "openclaw" || rawDefault === "claudecode" ? rawDefault : undefined,
    serverPort: parsePort(src.SERVER_PORT),
    dbPath: src.DB_PATH ?? "./talesauce.sqlite",
  };
}
