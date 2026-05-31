export interface Env {
  openclawUrl: string;
  openclawKey: string;
  taskModel?: string;
  idleModel?: string;
  serverPort: number;
  dbPath: string;
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
    serverPort: Number(src.SERVER_PORT ?? 8787),
    dbPath: src.DB_PATH ?? "./talesauce.sqlite",
  };
}
