import { db, sqlite } from "./index";
import { healthCheck } from "./schema";

export interface DbHealthStatus {
  connected: boolean;
  sqliteVersion: string | null;
  tableCount: number;
  dbPath: string;
  error?: string;
}

export function checkDbHealth(): DbHealthStatus {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS health_check (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checked_at TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);

    const versionResult = sqlite
      .prepare("SELECT sqlite_version() as version")
      .get() as { version: string };

    const tablesResult = sqlite
      .prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table'"
      )
      .get() as { count: number };

    db.insert(healthCheck)
      .values({
        checkedAt: new Date().toISOString(),
        status: "ok",
      })
      .run();

    return {
      connected: true,
      sqliteVersion: versionResult.version,
      tableCount: tablesResult.count,
      dbPath: "data/em-control-tower.db",
    };
  } catch (error) {
    return {
      connected: false,
      sqliteVersion: null,
      tableCount: 0,
      dbPath: "data/em-control-tower.db",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
