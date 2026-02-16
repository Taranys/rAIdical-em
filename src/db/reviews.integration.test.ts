// US-011: Reviews data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { upsertReview, getReviewCount } from "./reviews";

describe("reviews DAL (integration)", () => {
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
        ai_generated TEXT NOT NULL DEFAULT 'human',
        raw_json TEXT
      );
      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
        reviewer TEXT NOT NULL,
        state TEXT NOT NULL,
        submitted_at TEXT NOT NULL
      );
    `);

    // Insert a PR to reference
    testSqlite.exec(`
      INSERT INTO pull_requests (github_id, number, title, author, state, created_at)
      VALUES (12345, 1, 'Add feature', 'octocat', 'open', '2024-06-01T10:00:00Z');
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  const sampleReview = {
    githubId: 100001,
    pullRequestId: 1,
    reviewer: "reviewer1",
    state: "APPROVED",
    submittedAt: "2024-06-02T10:00:00Z",
  };

  it("inserts a new review", () => {
    const result = upsertReview(sampleReview, testDb);

    expect(result.githubId).toBe(100001);
    expect(result.pullRequestId).toBe(1);
    expect(result.reviewer).toBe("reviewer1");
    expect(result.state).toBe("APPROVED");
    expect(result.submittedAt).toBe("2024-06-02T10:00:00Z");
  });

  it("upserts an existing review without creating duplicates", () => {
    upsertReview(sampleReview, testDb);

    const updated = upsertReview(
      { ...sampleReview, state: "CHANGES_REQUESTED" },
      testDb,
    );

    expect(updated.state).toBe("CHANGES_REQUESTED");
    expect(getReviewCount(testDb)).toBe(1);
  });

  it("returns 0 count when no reviews exist", () => {
    expect(getReviewCount(testDb)).toBe(0);
  });

  it("counts all reviews", () => {
    upsertReview(sampleReview, testDb);
    upsertReview(
      { ...sampleReview, githubId: 100002, reviewer: "reviewer2" },
      testDb,
    );

    expect(getReviewCount(testDb)).toBe(2);
  });

  it("stores all review states correctly", () => {
    const states = ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"];

    states.forEach((state, i) => {
      const result = upsertReview(
        { ...sampleReview, githubId: 100001 + i, state },
        testDb,
      );
      expect(result.state).toBe(state);
    });
  });
});
