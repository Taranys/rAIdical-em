// US-2.05: Classification runs DAL integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  createClassificationRun,
  updateClassificationRunProgress,
  completeClassificationRun,
  getActiveClassificationRun,
  getLatestClassificationRun,
  getClassificationRunHistory,
} from "./classification-runs";

describe("classification-runs DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE classification_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        comments_processed INTEGER NOT NULL DEFAULT 0,
        errors INTEGER NOT NULL DEFAULT 0,
        model_used TEXT NOT NULL
      );
      CREATE INDEX idx_classification_runs_status ON classification_runs(status);
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("creates a classification run with running status", () => {
    const run = createClassificationRun("claude-haiku", testDb);

    expect(run.id).toBe(1);
    expect(run.status).toBe("running");
    expect(run.modelUsed).toBe("claude-haiku");
    expect(run.commentsProcessed).toBe(0);
    expect(run.errors).toBe(0);
    expect(run.completedAt).toBeNull();
  });

  it("updates progress of a classification run", () => {
    createClassificationRun("claude-haiku", testDb);
    const updated = updateClassificationRunProgress(1, 5, 1, testDb);

    expect(updated!.commentsProcessed).toBe(5);
    expect(updated!.errors).toBe(1);
    expect(updated!.status).toBe("running");
  });

  it("completes a classification run", () => {
    createClassificationRun("claude-haiku", testDb);
    const completed = completeClassificationRun(1, "success", 10, 2, testDb);

    expect(completed!.status).toBe("success");
    expect(completed!.commentsProcessed).toBe(10);
    expect(completed!.errors).toBe(2);
    expect(completed!.completedAt).toBeTruthy();
  });

  it("finds active (running) classification run", () => {
    createClassificationRun("claude-haiku", testDb);

    const active = getActiveClassificationRun(testDb);
    expect(active).not.toBeNull();
    expect(active!.status).toBe("running");
  });

  it("returns null when no active run", () => {
    createClassificationRun("claude-haiku", testDb);
    completeClassificationRun(1, "success", 10, 0, testDb);

    const active = getActiveClassificationRun(testDb);
    expect(active).toBeNull();
  });

  it("returns the latest classification run", () => {
    createClassificationRun("model-a", testDb);
    createClassificationRun("model-b", testDb);

    const latest = getLatestClassificationRun(testDb);
    expect(latest!.id).toBe(2);
    expect(latest!.modelUsed).toBe("model-b");
  });

  it("returns null when no runs exist", () => {
    const latest = getLatestClassificationRun(testDb);
    expect(latest).toBeNull();
  });

  it("returns classification run history ordered by most recent", () => {
    createClassificationRun("model-a", testDb);
    createClassificationRun("model-b", testDb);
    createClassificationRun("model-c", testDb);

    const history = getClassificationRunHistory(2, testDb);
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(3);
    expect(history[1].id).toBe(2);
  });
});
