import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, transaction } from "./DatabaseTool.js";
import { logger } from "./LogTool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, "../../database/migrations");

export const runMigrations = (migrationsDir = DEFAULT_MIGRATIONS_DIR) => {
  const db = getDb();

  // Ensure migrations tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (!fs.existsSync(migrationsDir)) {
    logger.warn(`Migrations directory not found: ${migrationsDir}`);
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const appliedRows = db.prepare("SELECT name FROM migrations").all();
  const appliedNames = new Set(appliedRows.map((row) => row.name));

  const newlyApplied = [];

  for (const file of files) {
    if (appliedNames.has(file)) {
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    logger.info(`Applying migration: ${file}`);

    transaction((dbInstance) => {
      dbInstance.exec(sqlContent);
      dbInstance.prepare("INSERT INTO migrations (name) VALUES (?)").run(file);
    });

    newlyApplied.push(file);
    logger.info(`Migration applied successfully: ${file}`);
  }

  return newlyApplied;
};
