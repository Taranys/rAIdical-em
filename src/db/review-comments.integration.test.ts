// US-012: Review comments data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  upsertReviewComment,
  getReviewCommentCount,
  getReviewCommentsByPR,
} from "./review-comments";

describe("review-comments DAL (integration)", () => {
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
      CREATE TABLE review_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
        reviewer TEXT NOT NULL,
        body TEXT NOT NULL,
        file_path TEXT,
        line INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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

  const sampleComment = {
    githubId: 300001,
    pullRequestId: 1,
    reviewer: "reviewer1",
    body: "Looks good, but consider refactoring this function.",
    filePath: "src/index.ts",
    line: 42,
    createdAt: "2024-06-02T10:00:00Z",
    updatedAt: "2024-06-02T10:00:00Z",
  };

  it("inserts a new review comment", () => {
    const result = upsertReviewComment(sampleComment, testDb);

    expect(result.githubId).toBe(300001);
    expect(result.pullRequestId).toBe(1);
    expect(result.reviewer).toBe("reviewer1");
    expect(result.body).toBe(
      "Looks good, but consider refactoring this function.",
    );
    expect(result.filePath).toBe("src/index.ts");
    expect(result.line).toBe(42);
    expect(result.createdAt).toBe("2024-06-02T10:00:00Z");
    expect(result.updatedAt).toBe("2024-06-02T10:00:00Z");
  });

  it("upserts an existing review comment without creating duplicates", () => {
    upsertReviewComment(sampleComment, testDb);

    const updated = upsertReviewComment(
      { ...sampleComment, body: "Updated comment body", line: 50 },
      testDb,
    );

    expect(updated.body).toBe("Updated comment body");
    expect(updated.line).toBe(50);
    expect(getReviewCommentCount(testDb)).toBe(1);
  });

  it("returns 0 count when no review comments exist", () => {
    expect(getReviewCommentCount(testDb)).toBe(0);
  });

  it("counts all review comments", () => {
    upsertReviewComment(sampleComment, testDb);
    upsertReviewComment(
      { ...sampleComment, githubId: 300002, reviewer: "reviewer2" },
      testDb,
    );

    expect(getReviewCommentCount(testDb)).toBe(2);
  });

  it("stores null filePath and line correctly", () => {
    const result = upsertReviewComment(
      { ...sampleComment, filePath: null, line: null },
      testDb,
    );

    expect(result.filePath).toBeNull();
    expect(result.line).toBeNull();
  });

  it("returns comments by pull request ID", () => {
    upsertReviewComment(sampleComment, testDb);
    upsertReviewComment(
      { ...sampleComment, githubId: 300002, reviewer: "reviewer2" },
      testDb,
    );

    const comments = getReviewCommentsByPR(1, testDb);
    expect(comments).toHaveLength(2);
    expect(comments[0].pullRequestId).toBe(1);
    expect(comments[1].pullRequestId).toBe(1);
  });

  it("returns empty array when no comments exist for PR", () => {
    const comments = getReviewCommentsByPR(999, testDb);
    expect(comments).toEqual([]);
  });
});
