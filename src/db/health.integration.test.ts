import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

describe("checkDbHealth (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("can create health_check table and insert a record", () => {
    testSqlite.exec(`
      CREATE TABLE IF NOT EXISTS health_check (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checked_at TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);

    const versionResult = testSqlite
      .prepare("SELECT sqlite_version() as version")
      .get() as { version: string };

    expect(versionResult.version).toBeDefined();
    expect(typeof versionResult.version).toBe("string");

    testDb
      .insert(schema.healthCheck)
      .values({
        checkedAt: new Date().toISOString(),
        status: "ok",
      })
      .run();

    const rows = testSqlite
      .prepare("SELECT * FROM health_check")
      .all() as Array<{ id: number; checked_at: string; status: string }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("ok");
  });

  it("returns table count from sqlite_master", () => {
    testSqlite.exec("CREATE TABLE test_table (id INTEGER PRIMARY KEY)");

    const result = testSqlite
      .prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table'"
      )
      .get() as { count: number };

    expect(result.count).toBeGreaterThanOrEqual(1);
  });
});
