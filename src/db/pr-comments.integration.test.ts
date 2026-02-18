// US-012: PR comments data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  upsertPrComment,
  getPrCommentCount,
  getPrCommentsByPR,
} from "./pr-comments";

describe("pr-comments DAL (integration)", () => {
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
      CREATE TABLE pr_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
        author TEXT NOT NULL,
        body TEXT NOT NULL,
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
    githubId: 400001,
    pullRequestId: 1,
    author: "commenter1",
    body: "Great work on this PR!",
    createdAt: "2024-06-02T10:00:00Z",
    updatedAt: "2024-06-02T10:00:00Z",
  };

  it("inserts a new PR comment", () => {
    const result = upsertPrComment(sampleComment, testDb);

    expect(result.githubId).toBe(400001);
    expect(result.pullRequestId).toBe(1);
    expect(result.author).toBe("commenter1");
    expect(result.body).toBe("Great work on this PR!");
    expect(result.createdAt).toBe("2024-06-02T10:00:00Z");
    expect(result.updatedAt).toBe("2024-06-02T10:00:00Z");
  });

  it("upserts an existing PR comment without creating duplicates", () => {
    upsertPrComment(sampleComment, testDb);

    const updated = upsertPrComment(
      { ...sampleComment, body: "Updated comment body" },
      testDb,
    );

    expect(updated.body).toBe("Updated comment body");
    expect(getPrCommentCount(testDb)).toBe(1);
  });

  it("returns 0 count when no PR comments exist", () => {
    expect(getPrCommentCount(testDb)).toBe(0);
  });

  it("counts all PR comments", () => {
    upsertPrComment(sampleComment, testDb);
    upsertPrComment(
      { ...sampleComment, githubId: 400002, author: "commenter2" },
      testDb,
    );

    expect(getPrCommentCount(testDb)).toBe(2);
  });

  it("returns comments by pull request ID", () => {
    upsertPrComment(sampleComment, testDb);
    upsertPrComment(
      { ...sampleComment, githubId: 400002, author: "commenter2" },
      testDb,
    );

    const comments = getPrCommentsByPR(1, testDb);
    expect(comments).toHaveLength(2);
    expect(comments[0].pullRequestId).toBe(1);
    expect(comments[1].pullRequestId).toBe(1);
  });

  it("returns empty array when no comments exist for PR", () => {
    const comments = getPrCommentsByPR(999, testDb);
    expect(comments).toEqual([]);
  });
});
