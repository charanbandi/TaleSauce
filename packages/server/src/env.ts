export interface Env {
  openclawUrl: string;
  openclawKey: string;
  taskModel?: string;
  idleModel?: string;
  serverPort: number;
  dbPath: string;
}

function parsePort(raw: string | undefined): number {
  const p = Number(raw ?? 8787);
  if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error(`Invalid SERVER_PORT: "${raw}"`);
  return p;
}

export function loadEnv(src: NodeJS.ProcessEnv = process.env): Env {
  const openclawUrl = src.OPENCLAW_API_URL;
  const openclawKey = src.OPENCLAW_API_KEY;
  if (!openclawUrl) throw new Error("Missing env OPENCLAW_API_URL");
  if (!openclawKey) throw new Error("Missing env OPENCLAW_API_KEY");
  return {
    openclawUrl,
    openclawKey,
    taskModel: src.OPENCLAW_TASK_MODEL || undefined,
    idleModel: src.OPENCLAW_IDLE_MODEL || undefined,
    serverPort: parsePort(src.SERVER_PORT),
    dbPath: src.DB_PATH ?? "./talesauce.sqlite",
  };
}
