import express from "express";
import { registerSessionsRoutes } from "./SessionsRoute.js";
import { registerRequestsRoutes } from "./RequestsRoute.js";
import { registerSystemRoutes } from "./SystemRoute.js";
import { registerTesterRoutes } from "./TesterRoute.js";
import { registerWebhookRoutes } from "./WebhookRoute.js";

export const registerRoutes = (app) => {
  // 1. Webhook Ingestion Routes (High Priority)
  registerWebhookRoutes(app);

  // 2. API v1 Router
  const apiRouter = express.Router();
  registerSessionsRoutes(apiRouter);
  registerRequestsRoutes(apiRouter);
  registerSystemRoutes(apiRouter);
  registerTesterRoutes(apiRouter);

  app.use("/api/v1", apiRouter);
};
