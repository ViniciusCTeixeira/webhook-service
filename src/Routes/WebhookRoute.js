import { WebhookIngestController } from "../Controllers/WebhookIngestController.js";

export const registerWebhookRoutes = (app) => {
  // Capture all methods on /w/:token and nested subpaths /w/:token/*
  app.all("/w/:token", WebhookIngestController.handle);
  app.all("/w/:token/*", WebhookIngestController.handle);

  // Backward compatibility legacy route
  app.all("/webhook", WebhookIngestController.handle);
  app.all("/webhook/*", WebhookIngestController.handle);
};
