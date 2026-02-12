// US-010: Sync runs data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  createSyncRun,
  completeSyncRun,
  failSyncRun,
  getLatestSyncRun,
} from "./sync-runs";

describe("sync-runs DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE sync_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repository TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        pr_count INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("creates a sync run with status 'running'", () => {
    const run = createSyncRun("owner/repo", testDb);

    expect(run.id).toBeDefined();
    expect(run.repository).toBe("owner/repo");
    expect(run.status).toBe("running");
    expect(run.startedAt).toBeTruthy();
    expect(run.completedAt).toBeNull();
    expect(run.prCount).toBe(0);
    expect(run.errorMessage).toBeNull();
  });

  it("completes a sync run with success status and prCount", () => {
    const run = createSyncRun("owner/repo", testDb);
    completeSyncRun(run.id, 42, testDb);

    const rows = testSqlite
      .prepare("SELECT * FROM sync_runs WHERE id = ?")
      .all(run.id) as Record<string, unknown>[];
    expect(rows[0].status).toBe("success");
    expect(rows[0].pr_count).toBe(42);
    expect(rows[0].completed_at).toBeTruthy();
  });

  it("fails a sync run with error status and message", () => {
    const run = createSyncRun("owner/repo", testDb);
    failSyncRun(run.id, "Rate limit exceeded", testDb);

    const rows = testSqlite
      .prepare("SELECT * FROM sync_runs WHERE id = ?")
      .all(run.id) as Record<string, unknown>[];
    expect(rows[0].status).toBe("error");
    expect(rows[0].error_message).toBe("Rate limit exceeded");
    expect(rows[0].completed_at).toBeTruthy();
  });

  it("returns the latest sync run for a repository", () => {
    createSyncRun("owner/repo", testDb);
    const second = createSyncRun("owner/repo", testDb);
    completeSyncRun(second.id, 10, testDb);

    const latest = getLatestSyncRun("owner/repo", testDb);
    expect(latest).toBeTruthy();
    expect(latest!.id).toBe(second.id);
  });

  it("returns null when no sync runs exist for repository", () => {
    expect(getLatestSyncRun("owner/repo", testDb)).toBeNull();
  });

  it("only returns sync runs for the specified repository", () => {
    createSyncRun("other/repo", testDb);

    expect(getLatestSyncRun("owner/repo", testDb)).toBeNull();
  });
});
