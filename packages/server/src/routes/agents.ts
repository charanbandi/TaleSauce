import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import type { AgentConfig } from "@talesauce/shared";
import { Orchestrator } from "../orchestrator.js";

const MAX_AGENTS = 6;

export function registerAgentRoutes(app: FastifyInstance, orch: Orchestrator) {
  app.get("/agents", async () => orch.runtimes());

  app.post("/agents/:id/task", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { task } = req.body as { task: string };
    if (!task) return reply.code(400).send({ error: "task required" });
    orch.startTask(id, task);
    return { ok: true };
  });

  app.post("/agents/:id/reply", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { text } = req.body as { text: string };
    if (!text) return reply.code(400).send({ error: "text required" });
    orch.reply(id, text);
    return { ok: true };
  });

  app.post("/agents", async (req, reply) => {
    if (orch.runtimes().length >= MAX_AGENTS)
      return reply.code(400).send({ error: `Max ${MAX_AGENTS} agents` });
    const body = req.body as Omit<AgentConfig, "id">;
    const cfg: AgentConfig = { ...body, id: nanoid() };
    return orch.addAgent(cfg);
  });
}
