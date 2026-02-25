import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

export const DB_PATH = path.join(process.cwd(), "data", "rAIdical-em.db");
const migrationsFolder = path.join(process.cwd(), "drizzle");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Use a mutable container so that all modules importing `db` or `sqlite`
// keep a reference to the *same* object. When replaceDatabase() swaps the
// underlying connection, every consumer sees the new instance immediately.
//
// Persist on globalThis so Next.js dev-mode HMR doesn't create a second
// connection (the old one would become stale after replaceDatabase()).
type DbState = {
  sqlite: InstanceType<typeof Database>;
  db: ReturnType<typeof drizzle<typeof schema>>;
};
const globalKey = "__em_ct_db_state__" as const;
const _existing = (globalThis as Record<string, unknown>)[globalKey] as DbState | undefined;

let _state: DbState;
if (_existing?.sqlite?.open) {
  _state = _existing;
} else {
  const sq = new Database(DB_PATH);
  sq.pragma("journal_mode = WAL");
  sq.pragma("busy_timeout = 5000");
  _state = { sqlite: sq, db: drizzle(sq, { schema }) };
  (globalThis as Record<string, unknown>)[globalKey] = _state;
}

// Re-export as named getters so `import { db } from "@/db"` always
// resolves to the current live instance, even after replaceDatabase().
// Methods are bound to the real target so `this` context stays correct
// when Drizzle chains calls (e.g. db.select().from().where()).
export const db: typeof _state.db = new Proxy({} as typeof _state.db, {
  get(_target, prop) {
    const value = Reflect.get(_state.db, prop, _state.db);
    return typeof value === "function" ? value.bind(_state.db) : value;
  },
});
export const sqlite: typeof _state.sqlite = new Proxy(
  {} as typeof _state.sqlite,
  {
    get(_target, prop) {
      const value = Reflect.get(_state.sqlite, prop, _state.sqlite);
      return typeof value === "function" ? value.bind(_state.sqlite) : value;
    },
  },
);

// Auto-run migrations on startup
if (fs.existsSync(migrationsFolder)) {
  migrate(_state.db, { migrationsFolder });
}

// US-2.17: Replace the active database with a new file.
// The imported file must already contain the expected schema (validated
// by the API route before calling this function).
export function replaceDatabase(newFilePath: string): void {
  // Keep old connection alive until the new one is ready so concurrent
  // requests never hit a closed database (race condition fix).
  const oldSqlite = _state.sqlite;

  // Close old connection (checkpoints WAL → main file)
  oldSqlite.close();

  // Remove stale WAL/SHM files left by the old connection so the new
  // DB file is read cleanly without inheriting leftover WAL state.
  for (const suffix of ["-wal", "-shm"]) {
    try {
      fs.unlinkSync(DB_PATH + suffix);
    } catch {
      // May not exist — that's fine
    }
  }

  // Overwrite database file
  fs.copyFileSync(newFilePath, DB_PATH);

  // Open new connection and swap atomically — the Proxy ensures all
  // consumers see the new instance as soon as _state is updated.
  const newSqlite = new Database(DB_PATH);
  newSqlite.pragma("journal_mode = WAL");
  newSqlite.pragma("busy_timeout = 5000");
  _state.sqlite = newSqlite;
  _state.db = drizzle(newSqlite, { schema });
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
