import type { FastifyInstance } from "fastify";
import { Db } from "../db/db.js";

export function registerSettingsRoutes(app: FastifyInstance, db: Db) {
  app.get("/settings", async () => db.getSettings());
  app.put("/settings", async (req) => {
    const body = req.body as { sliderPct: number; focus: string | null };
    db.saveSettings(body);
    return { ok: true };
  });
}
