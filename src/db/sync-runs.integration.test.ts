// US-010 / US-011: Sync runs data access layer integration tests
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
  getSyncRunHistory,
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
        review_count INTEGER NOT NULL DEFAULT 0,
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
    expect(run.reviewCount).toBe(0);
    expect(run.completedAt).toBeNull();
    expect(run.startedAt).toBeTruthy();
  });

  it("completes a sync run with success", () => {
    const run = createSyncRun("owner/repo", testDb);
    const completed = completeSyncRun(run.id, "success", 42, null, 15, 0, testDb);

    expect(completed.status).toBe("success");
    expect(completed.prCount).toBe(42);
    expect(completed.reviewCount).toBe(15);
    expect(completed.completedAt).toBeTruthy();
    expect(completed.errorMessage).toBeNull();
  });

  it("completes a sync run with error", () => {
    const run = createSyncRun("owner/repo", testDb);
    const completed = completeSyncRun(run.id, "error", 10, "Rate limit exceeded", 3, 0, testDb);

    expect(completed.status).toBe("error");
    expect(completed.prCount).toBe(10);
    expect(completed.reviewCount).toBe(3);
    expect(completed.errorMessage).toBe("Rate limit exceeded");
    expect(completed.completedAt).toBeTruthy();
  });

  it("updates sync run progress with review count", () => {
    const run = createSyncRun("owner/repo", testDb);
    const updated = updateSyncRunProgress(run.id, 25, 10, 0, testDb);

    expect(updated.prCount).toBe(25);
    expect(updated.reviewCount).toBe(10);
    expect(updated.status).toBe("running");
  });

  it("returns latest sync run for a repository", () => {
    createSyncRun("owner/repo", testDb);
    const second = createSyncRun("owner/repo", testDb);
    completeSyncRun(second.id, "success", 50, null, 0, 0, testDb);

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
    completeSyncRun(run.id, "success", 10, null, 0, 0, testDb);

    expect(getActiveSyncRun("owner/repo", testDb)).toBeNull();
  });

  it("does not return sync runs from other repositories", () => {
    createSyncRun("other/repo", testDb);

    expect(getLatestSyncRun("owner/repo", testDb)).toBeNull();
    expect(getActiveSyncRun("owner/repo", testDb)).toBeNull();
  });

  // US-013: getSyncRunHistory tests
  describe("getSyncRunHistory", () => {
    it("returns empty array when no sync runs exist", () => {
      const history = getSyncRunHistory("owner/repo", 10, testDb);
      expect(history).toEqual([]);
    });

    it("returns sync runs ordered by most recent first", () => {
      const first = createSyncRun("owner/repo", testDb);
      completeSyncRun(first.id, "success", 10, null, 0, 0, testDb);
      const second = createSyncRun("owner/repo", testDb);
      completeSyncRun(second.id, "error", 5, "Rate limit", 0, 0, testDb);
      const third = createSyncRun("owner/repo", testDb);
      completeSyncRun(third.id, "success", 20, null, 0, 0, testDb);

      const history = getSyncRunHistory("owner/repo", 10, testDb);

      expect(history).toHaveLength(3);
      expect(history[0].id).toBe(third.id);
      expect(history[1].id).toBe(second.id);
      expect(history[2].id).toBe(first.id);
    });

    it("respects the limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        const run = createSyncRun("owner/repo", testDb);
        completeSyncRun(run.id, "success", i * 10, null, 0, 0, testDb);
      }

      const history = getSyncRunHistory("owner/repo", 2, testDb);

      expect(history).toHaveLength(2);
      // Should be the 2 most recent
      expect(history[0].prCount).toBe(40);
      expect(history[1].prCount).toBe(30);
    });

    it("only returns runs for the specified repository", () => {
      const run1 = createSyncRun("owner/repo", testDb);
      completeSyncRun(run1.id, "success", 10, null, 0, 0, testDb);
      const run2 = createSyncRun("other/repo", testDb);
      completeSyncRun(run2.id, "success", 20, null, 0, 0, testDb);

      const history = getSyncRunHistory("owner/repo", 10, testDb);

      expect(history).toHaveLength(1);
      expect(history[0].repository).toBe("owner/repo");
    });
  });
});
