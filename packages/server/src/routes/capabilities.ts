import type { FastifyInstance } from "fastify";
import type { Capabilities } from "../capabilities.js";

export function registerCapabilitiesRoutes(app: FastifyInstance, caps: Capabilities) {
  app.get("/capabilities", async () => caps);
}
