import express from "express";
import http from "node:http";
import ip from "ip";
import AppConfig from "./configs/AppConfig.js";
import CorsConfig from "./configs/CorsConfig.js";
import { initDatabase, closeDatabase } from "./src/Tools/DatabaseTool.js";
import { runMigrations } from "./src/Tools/MigrationTool.js";
import { logger } from "./src/Tools/LogTool.js";
import { initSocket } from "./src/Tools/SocketTool.js";
import { SessionsResource } from "./src/Resources/SessionsResource.js";
import { registerRoutes } from "./src/Routes/index.js";
import { getLiveness, getReadiness } from "./src/Tools/HealthTool.js";

// Global app state
const app = express();
const server = http.createServer(app);

// 1. Validate environment
AppConfig.validateEnv();

// 2. Initialize database and run migrations
try {
  initDatabase();
  const applied = runMigrations();
  if (applied.length > 0) {
    logger.info(`Migrações executadas com sucesso: ${applied.join(", ")}`);
  }
  // Ensure default session exists
  SessionsResource.ensureDefaultSession();
} catch (e) {
  logger.error("Falha ao inicializar o banco de dados:", e.message);
  process.exit(1);
}

// 3. Middlewares
AppConfig.setMaxListeners();
app.use(CorsConfig.getMiddleware());
AppConfig.setBodyParser(app);

// 4. Socket.IO initialization
const io = initSocket(server);

// 5. Health & Readiness Probes
app.get("/health", (_req, res) => {
  const result = getLiveness();
  res.status(result.statusCode).json(result.body);
});

app.get("/ready", (_req, res) => {
  const result = getReadiness();
  res.status(result.statusCode).json(result.body);
});

// 6. Static files for Dashboard UI
AppConfig.setStaticDashboard(app);

// 7. Register domain and webhook routes
registerRoutes(app);

// 8. SPA Fallback for Dashboard UI
AppConfig.setSpaFallback(app);

// 9. Error Handling
AppConfig.setErrorHandlers(app);

// 10. Start HTTP and Socket server
const port = AppConfig.port();
server.listen(port, () => {
  logger.info(`====================================================`);
  logger.info(` Webhook Service v3.0 iniciado na porta ${port}`);
  logger.info(` Ambiente: ${AppConfig.nodeEnv()}`);
  logger.info(` Acesso Local:     http://localhost:${port}`);
  logger.info(` Acesso na Rede:   http://${ip.address()}:${port}`);
  logger.info(` Webhook Default:  http://localhost:${port}/w/default`);
  logger.info(`====================================================`);
});

// 11. Graceful Shutdown
let isShuttingDown = false;
const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Sinal ${signal} recebido. Encerrando conexões com segurança...`);

  if (io) {
    io.close();
  }

  server.close(() => {
    logger.info("Servidor HTTP encerrado.");
    closeDatabase();
    logger.info("Banco de dados SQLite fechado. Processo concluído.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Encerramento forçado por timeout de 5 segundos.");
    process.exit(1);
  }, 5000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app, server, io };
