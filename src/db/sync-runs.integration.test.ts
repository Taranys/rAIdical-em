// US-010: Sync runs data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  createSyncRun,
  completeSyncRun,
  updateSyncRunProgress,
  getLatestSyncRun,
  getActiveSyncRun,
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

  it("creates a sync run with running status", () => {
    const run = createSyncRun("owner/repo", testDb);

    expect(run.repository).toBe("owner/repo");
    expect(run.status).toBe("running");
    expect(run.prCount).toBe(0);
    expect(run.completedAt).toBeNull();
    expect(run.startedAt).toBeTruthy();
  });

  it("completes a sync run with success", () => {
    const run = createSyncRun("owner/repo", testDb);
    const completed = completeSyncRun(run.id, "success", 42, null, testDb);

    expect(completed.status).toBe("success");
    expect(completed.prCount).toBe(42);
    expect(completed.completedAt).toBeTruthy();
    expect(completed.errorMessage).toBeNull();
  });

  it("completes a sync run with error", () => {
    const run = createSyncRun("owner/repo", testDb);
    const completed = completeSyncRun(run.id, "error", 10, "Rate limit exceeded", testDb);

    expect(completed.status).toBe("error");
    expect(completed.prCount).toBe(10);
    expect(completed.errorMessage).toBe("Rate limit exceeded");
    expect(completed.completedAt).toBeTruthy();
  });

  it("updates sync run progress", () => {
    const run = createSyncRun("owner/repo", testDb);
    const updated = updateSyncRunProgress(run.id, 25, testDb);

    expect(updated.prCount).toBe(25);
    expect(updated.status).toBe("running");
  });

  it("returns latest sync run for a repository", () => {
    createSyncRun("owner/repo", testDb);
    const second = createSyncRun("owner/repo", testDb);
    completeSyncRun(second.id, "success", 50, null, testDb);

    const latest = getLatestSyncRun("owner/repo", testDb);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(second.id);
  });

  it("returns null when no sync runs exist", () => {
    expect(getLatestSyncRun("owner/repo", testDb)).toBeNull();
  });

  it("returns active sync run when one is running", () => {
    const run = createSyncRun("owner/repo", testDb);

    const active = getActiveSyncRun("owner/repo", testDb);
    expect(active).not.toBeNull();
    expect(active!.id).toBe(run.id);
  });

  it("returns null for active sync run when none running", () => {
    const run = createSyncRun("owner/repo", testDb);
    completeSyncRun(run.id, "success", 10, null, testDb);

    expect(getActiveSyncRun("owner/repo", testDb)).toBeNull();
  });

  it("does not return sync runs from other repositories", () => {
    createSyncRun("other/repo", testDb);

    expect(getLatestSyncRun("owner/repo", testDb)).toBeNull();
    expect(getActiveSyncRun("owner/repo", testDb)).toBeNull();
  });
});
