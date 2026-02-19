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

// Use a mutable container so that all modules importing `db` or `sqlite`
// keep a reference to the *same* object. When replaceDatabase() swaps the
// underlying connection, every consumer sees the new instance immediately.
const _state = {
  sqlite: new Database(DB_PATH),
  db: null as unknown as ReturnType<typeof drizzle<typeof schema>>,
};
_state.sqlite.pragma("journal_mode = WAL");
_state.db = drizzle(_state.sqlite, { schema });

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
  // Close current connection (also checkpoints WAL → main file)
  _state.sqlite.close();

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

  // Reopen connection
  _state.sqlite = new Database(DB_PATH);
  _state.sqlite.pragma("journal_mode = WAL");
  _state.db = drizzle(_state.sqlite, { schema });
}
