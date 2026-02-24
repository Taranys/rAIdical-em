import { sqlite } from "./index";

export interface DbHealthStatus {
  connected: boolean;
  sqliteVersion: string | null;
  tableCount: number;
  dbPath: string;
  error?: string;
}

export function checkDbHealth(): DbHealthStatus {
  try {
    const versionResult = sqlite
      .prepare("SELECT sqlite_version() as version")
      .get() as { version: string };

    const tablesResult = sqlite
      .prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'"
      )
      .get() as { count: number };

    return {
      connected: true,
      sqliteVersion: versionResult.version,
      tableCount: tablesResult.count,
      dbPath: "data/rAIdical-em.db",
    };
  } catch (error) {
    return {
      connected: false,
      sqliteVersion: null,
      tableCount: 0,
      dbPath: "data/rAIdical-em.db",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
