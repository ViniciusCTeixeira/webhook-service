import winston from "winston";
import fs from "node:fs";
import path from "node:path";
import { readRuntimeConfig } from "../../configs/RuntimeConfig.js";

const { rootDir } = readRuntimeConfig();
const logsDir = path.join(rootDir, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.splat(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logsDir, "combined.log") }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf((info) => {
          const { timestamp, level, message, ...meta } = info;
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `|${level} ${timestamp}| -> ${message}${metaStr}`;
        })
      ),
    }),
  ],
});
