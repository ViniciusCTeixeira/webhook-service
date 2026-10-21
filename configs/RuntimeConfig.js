import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

export const readRuntimeConfig = () => {
  const port = parseInt(process.env.PORT || "3000", 10);
  const nodeEnv = process.env.NODE_ENV || "development";
  const dbPath = process.env.DB_PATH
    ? path.resolve(ROOT_DIR, process.env.DB_PATH)
    : path.resolve(ROOT_DIR, "data", "webhook.sqlite");
  const maxPayloadMb = parseInt(process.env.MAX_PAYLOAD_MB || "50", 10);
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;

  return {
    rootDir: ROOT_DIR,
    app: {
      port,
      nodeEnv,
      publicUrl,
      maxPayloadMb,
    },
    db: {
      path: dbPath,
    },
  };
};

export const validateRuntimeConfig = () => {
  const config = readRuntimeConfig();
  if (isNaN(config.app.port) || config.app.port <= 0 || config.app.port > 65535) {
    throw new Error(`PORT inválida configurada: ${process.env.PORT}`);
  }
  return config;
};
