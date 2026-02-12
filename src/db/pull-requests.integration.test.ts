// US-010: Pull requests data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  upsertPullRequest,
  upsertPullRequests,
  getPullRequestCount,
} from "./pull-requests";

describe("pull-requests DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
      CREATE TABLE pull_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        merged_at TEXT,
        additions INTEGER NOT NULL DEFAULT 0,
        deletions INTEGER NOT NULL DEFAULT 0,
        changed_files INTEGER NOT NULL DEFAULT 0,
        ai_generated INTEGER NOT NULL DEFAULT 0,
        raw_json TEXT
      );
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  const samplePR = {
    githubId: 123456,
    number: 42,
    title: "Add feature X",
    author: "octocat",
    state: "open",
    createdAt: "2024-06-01T10:00:00Z",
    mergedAt: null,
    additions: 100,
    deletions: 20,
    changedFiles: 5,
    rawJson: '{"id":123456}',
  };

  it("inserts a new pull request", () => {
    upsertPullRequest(samplePR, testDb);

    const rows = testSqlite
      .prepare("SELECT * FROM pull_requests")
      .all() as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].github_id).toBe(123456);
    expect(rows[0].number).toBe(42);
    expect(rows[0].title).toBe("Add feature X");
    expect(rows[0].author).toBe("octocat");
    expect(rows[0].state).toBe("open");
    expect(rows[0].additions).toBe(100);
    expect(rows[0].deletions).toBe(20);
    expect(rows[0].changed_files).toBe(5);
  });

  it("updates existing pull request on conflict (same githubId)", () => {
    upsertPullRequest(samplePR, testDb);

    upsertPullRequest(
      {
        ...samplePR,
        title: "Add feature X (updated)",
        state: "merged",
        mergedAt: "2024-06-02T12:00:00Z",
        additions: 150,
        deletions: 30,
        changedFiles: 7,
      },
      testDb,
    );

    const rows = testSqlite
      .prepare("SELECT * FROM pull_requests")
      .all() as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Add feature X (updated)");
    expect(rows[0].state).toBe("merged");
    expect(rows[0].merged_at).toBe("2024-06-02T12:00:00Z");
    expect(rows[0].additions).toBe(150);
    expect(rows[0].deletions).toBe(30);
    expect(rows[0].changed_files).toBe(7);
  });

  it("upserts multiple pull requests in batch", () => {
    const prs = [
      { ...samplePR, githubId: 1, number: 1, title: "PR 1" },
      { ...samplePR, githubId: 2, number: 2, title: "PR 2" },
      { ...samplePR, githubId: 3, number: 3, title: "PR 3" },
    ];

    upsertPullRequests(prs, testDb);

    const rows = testSqlite
      .prepare("SELECT * FROM pull_requests")
      .all() as Record<string, unknown>[];
    expect(rows).toHaveLength(3);
  });

  it("returns correct pull request count", () => {
    expect(getPullRequestCount(testDb)).toBe(0);

    upsertPullRequests(
      [
        { ...samplePR, githubId: 1, number: 1, title: "PR 1" },
        { ...samplePR, githubId: 2, number: 2, title: "PR 2" },
      ],
      testDb,
    );

    expect(getPullRequestCount(testDb)).toBe(2);
  });

  it("handles null mergedAt and rawJson", () => {
    upsertPullRequest(
      { ...samplePR, mergedAt: null, rawJson: null },
      testDb,
    );

    const rows = testSqlite
      .prepare("SELECT * FROM pull_requests")
      .all() as Record<string, unknown>[];
    expect(rows[0].merged_at).toBeNull();
    expect(rows[0].raw_json).toBeNull();
  });
});
