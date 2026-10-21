import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { readRuntimeConfig } from "../../configs/RuntimeConfig.js";

let instance = null;
let currentDbPath = null;

export const initDatabase = (customPath = null) => {
  if (instance) {
    return instance;
  }

  const dbPath = customPath || readRuntimeConfig().db.path;
  currentDbPath = dbPath;

  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  // Configure SQLite for high performance, concurrency and integrity
  if (dbPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA busy_timeout = 5000;");

  instance = db;
  return instance;
};

export const getDb = () => {
  if (!instance) {
    return initDatabase();
  }
  return instance;
};

export const transaction = (fn) => {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = fn(db);
    db.exec("COMMIT;");
    return result;
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
};

export const closeDatabase = () => {
  if (instance) {
    try {
      instance.close();
    } catch {
      // Ignored if already closed
    }
    instance = null;
    currentDbPath = null;
  }
};

export const getDbPath = () => currentDbPath;
