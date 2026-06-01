import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// Load .env from monorepo root, anchored to this module's location
// src/index.ts → packages/server/src/ → ../../../ = repo root
const here = fileURLToPath(new URL(".", import.meta.url));
dotenvConfig({ path: resolve(here, "../../../.env") });

import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import { loadEnv } from "./env.js";
import { Db } from "./db/db.js";
import { seedStarter } from "./db/seed.js";
import { detectCapabilities } from "./capabilities.js";
import { Orchestrator } from "./orchestrator.js";
import { makeBrainFactory } from "./brains/factory.js";
import { encodeEvent, type ServerEvent } from "@talesauce/shared";
import { registerAgentRoutes } from "./routes/agents.js";
import { registerHistoryRoutes } from "./routes/history.js";
import { registerSettingsRoutes } from "./routes/settings.js";
import { registerCapabilitiesRoutes } from "./routes/capabilities.js";

const env = loadEnv();
const db = new Db(env.dbPath);
const caps = detectCapabilities(env);
seedStarter(db, caps);

const orch = new Orchestrator(db, makeBrainFactory(db, env));
const sockets = new Set<{ send: (s: string) => void }>();
orch.onEvent((e: ServerEvent) => {
  const msg = encodeEvent(e);
  for (const s of sockets) { try { s.send(msg); } catch { /* dropped */ } }
});

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);

app.get("/health", async () => ({ ok: true }));
registerAgentRoutes(app, orch);
registerHistoryRoutes(app, db);
registerSettingsRoutes(app, db);
registerCapabilitiesRoutes(app, caps);

app.register(async (f) => {
  f.get("/ws", { websocket: true }, (socket) => {
    const peer = { send: (s: string) => socket.send(s) };
    sockets.add(peer);
    socket.send(encodeEvent({ type: "hello", agents: orch.runtimes() }));
    for (const rt of orch.runtimes()) {
      for (const p of orch.pendingPermissions(rt.config.id)) {
        socket.send(encodeEvent({ type: "permission", agentId: rt.config.id, requestId: p.requestId, tool: p.tool, summary: p.summary }));
      }
    }
    socket.on("close", () => sockets.delete(peer));
  });
});

app.listen({ port: env.serverPort, host: "127.0.0.1" })
  .then((addr) => app.log.info(`TaleSauce server on ${addr}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
