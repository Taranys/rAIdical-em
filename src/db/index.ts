import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "em-control-tower.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { sqlite };

// Auto-run migrations on startup
const migrationsFolder = path.join(process.cwd(), "drizzle");
if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
}

// Backfill team member colors (one-time, idempotent)
// Uses raw SQL to avoid circular import with team-members.ts
const BACKFILL_PALETTE = [
  "#E25A3B", "#2A9D8F", "#264653", "#E9C46A", "#F4A261", "#7209B7",
  "#3A86FF", "#06D6A0", "#EF476F", "#118AB2", "#8338EC", "#FF6B6B",
];
const membersToBackfill = sqlite
  .prepare("SELECT id FROM team_members WHERE is_active = 1 AND color = '#E25A3B' ORDER BY id")
  .all() as { id: number }[];
if (membersToBackfill.length > 1) {
  const updateStmt = sqlite.prepare("UPDATE team_members SET color = ? WHERE id = ?");
  for (let i = 0; i < membersToBackfill.length; i++) {
    updateStmt.run(BACKFILL_PALETTE[i % BACKFILL_PALETTE.length], membersToBackfill[i].id);
  }
}
