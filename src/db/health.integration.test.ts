import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";

describe("checkDbHealth (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("can query SQLite version", () => {
    const versionResult = testSqlite
      .prepare("SELECT sqlite_version() as version")
      .get() as { version: string };

    expect(versionResult.version).toBeDefined();
    expect(typeof versionResult.version).toBe("string");
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
