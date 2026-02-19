import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

export const DB_PATH = path.join(process.cwd(), "data", "em-control-tower.db");
const migrationsFolder = path.join(process.cwd(), "drizzle");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

let db = drizzle(sqlite, { schema });
export { db, sqlite };

// Auto-run migrations on startup
if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
}

// US-2.17: Replace the active database with a new file
export function replaceDatabase(newFilePath: string): void {
  // Close current connection
  sqlite.close();

  // Overwrite database file
  fs.copyFileSync(newFilePath, DB_PATH);

  // Reopen connection
  sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  db = drizzle(sqlite, { schema });

  // Apply pending migrations
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  }
}
