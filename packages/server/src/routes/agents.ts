import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { statSync } from "node:fs";
import type { AgentConfig, BrainKind } from "@talesauce/shared";
import { Orchestrator } from "../orchestrator.js";

const CODING_BRAINS: BrainKind[] = ["claudecode", "codex", "cursor"];

function validWorkingDir(dir: unknown): dir is string {
  if (typeof dir !== "string" || !dir) return false;
  try { return statSync(dir).isDirectory(); } catch { return false; }
}

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
    const kind = (body as any).brainKind as BrainKind;
    if (CODING_BRAINS.includes(kind) && !validWorkingDir((body as any).workingDir))
      return reply.code(400).send({ error: `${kind} agents need a valid workingDir (an existing directory)` });
    const cfg: AgentConfig = { ...body, id: nanoid() };
    return orch.addAgent(cfg);
  });

  app.post("/agents/:id/decision", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { requestId, decision } = req.body as { requestId: string; decision: "allow" | "deny" };
    if (!requestId || (decision !== "allow" && decision !== "deny"))
      return reply.code(400).send({ error: "requestId and decision (allow|deny) required" });
    orch.decide(id, requestId, decision === "allow");
    return { ok: true };
  });

  app.patch("/agents/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const patch = req.body as { name?: string; brainKind?: BrainKind; model?: string; sessionId?: string; workingDir?: string };
    if (patch.brainKind && CODING_BRAINS.includes(patch.brainKind) && patch.workingDir !== undefined && !validWorkingDir(patch.workingDir))
      return reply.code(400).send({ error: "workingDir must be an existing directory" });
    orch.updateAgentConfig(id, patch);
    return { ok: true };
  });
}
