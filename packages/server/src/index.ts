import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

// Load .env from monorepo root, anchored to this module's location
// src/index.ts → packages/server/src/ → ../../../ = repo root
const here = fileURLToPath(new URL(".", import.meta.url));
dotenvConfig({ path: resolve(here, "../../../.env") });

import Fastify from "fastify";
import { loadEnv } from "./env.js";

const env = loadEnv();
const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

app
  .listen({ port: env.serverPort, host: "127.0.0.1" })
  .then((addr) => app.log.info(`TaleSauce server on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
