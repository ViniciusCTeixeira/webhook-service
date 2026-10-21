import express from "express";
import { EventEmitter } from "node:events";
import path from "node:path";
import fs from "node:fs";
import { readRuntimeConfig, validateRuntimeConfig } from "./RuntimeConfig.js";
import { logger } from "../src/Tools/LogTool.js";

class AppConfig {
  static port() {
    return readRuntimeConfig().app.port;
  }

  static nodeEnv() {
    return readRuntimeConfig().app.nodeEnv;
  }

  static publicUrl() {
    return readRuntimeConfig().app.publicUrl;
  }

  static setBodyParser(app) {
    const maxPayload = `${readRuntimeConfig().app.maxPayloadMb}mb`;

    // Capture raw body for signature verification and exact payload replay
    const rawCapture = (req, _res, buf) => {
      req.rawBody = buf ? buf.toString("utf8") : "";
    };

    app.use(express.json({ limit: maxPayload, verify: rawCapture }));
    app.use(express.urlencoded({ limit: maxPayload, extended: true, verify: rawCapture }));
    app.use(express.text({ limit: maxPayload, type: ["text/*", "application/xml", "application/javascript"], verify: rawCapture }));
    app.use(express.raw({ limit: maxPayload, type: ["application/octet-stream", "multipart/form-data"], verify: rawCapture }));
  }

  static setMaxListeners() {
    process.setMaxListeners(200);
    EventEmitter.defaultMaxListeners = 200;
  }

  static setStaticDashboard(app) {
    const { rootDir } = readRuntimeConfig();
    const dashboardPublicPath = path.join(rootDir, "public", "dashboard");

    if (fs.existsSync(dashboardPublicPath)) {
      app.use("/dashboard", express.static(dashboardPublicPath));
      app.use(express.static(dashboardPublicPath)); // also serve root assets
    }

    // Serve public directory
    const publicPath = path.join(rootDir, "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
  }

  static setSpaFallback(app) {
    const { rootDir } = readRuntimeConfig();
    const dashboardIndex = path.join(rootDir, "public", "dashboard", "index.html");

    app.use((req, res, next) => {
      // Don't intercept API routes or Webhook ingestion routes
      if (
        req.path.startsWith("/api/") ||
        req.path.startsWith("/w/") ||
        req.path === "/webhook" ||
        req.path === "/health" ||
        req.path === "/ready"
      ) {
        return next();
      }

      if (fs.existsSync(dashboardIndex) && (req.method === "GET" || req.method === "HEAD")) {
        return res.sendFile(dashboardIndex);
      }
      next();
    });
  }

  static setErrorHandlers(app) {
    app.use((req, res, next) => {
      if (res.headersSent) return next();
      res.status(404).json({ success: false, message: "Rota não encontrada." });
    });

    app.use((error, req, res, next) => {
      if (res.headersSent) return next(error);
      if (error?.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "Payload acima do limite permitido." });
      }
      if (error?.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "JSON inválido no corpo da requisição." });
      }
      logger.error("Internal Server Error:", error?.message || error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor." });
    });
  }

  static validateEnv() {
    try {
      validateRuntimeConfig();
    } catch (e) {
      logger.error("Falha ao validar variáveis de ambiente:", e.message);
      process.exit(1);
    }
  }
}

export default AppConfig;
