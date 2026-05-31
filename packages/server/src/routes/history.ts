import type { FastifyInstance } from "fastify";
import { Db } from "../db/db.js";

export function registerHistoryRoutes(app: FastifyInstance, db: Db) {
  app.get("/agents/:id/history", async (req) => {
    const { id } = req.params as { id: string };
    return db.listMessages(id);
  });
}
