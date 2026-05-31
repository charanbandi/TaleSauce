import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load .env from monorepo root (two levels up from packages/server)
dotenvConfig({ path: resolve(process.cwd(), "../../.env") });

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
