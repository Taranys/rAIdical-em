// US-010: Pull requests data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  upsertPullRequest,
  getPullRequestCount,
  getPRsOpenedByMember,
  getPRsOpenedPerWeek,
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
    githubId: 12345,
    number: 1,
    title: "Add feature",
    author: "octocat",
    state: "open" as const,
    createdAt: "2024-06-01T10:00:00Z",
    mergedAt: null,
    additions: 50,
    deletions: 10,
    changedFiles: 3,
  };

  it("inserts a new pull request", () => {
    const result = upsertPullRequest(samplePR, testDb);

    expect(result.githubId).toBe(12345);
    expect(result.number).toBe(1);
    expect(result.title).toBe("Add feature");
    expect(result.author).toBe("octocat");
    expect(result.state).toBe("open");
    expect(result.additions).toBe(50);
    expect(result.deletions).toBe(10);
    expect(result.changedFiles).toBe(3);
    expect(result.mergedAt).toBeNull();
  });

  it("upserts an existing pull request without creating duplicates", () => {
    upsertPullRequest(samplePR, testDb);

    const updated = upsertPullRequest(
      { ...samplePR, title: "Updated title", state: "merged", mergedAt: "2024-06-02T10:00:00Z" },
      testDb,
    );

    expect(updated.title).toBe("Updated title");
    expect(updated.state).toBe("merged");
    expect(updated.mergedAt).toBe("2024-06-02T10:00:00Z");
    expect(getPullRequestCount(testDb)).toBe(1);
  });

  it("returns 0 count when no pull requests exist", () => {
    expect(getPullRequestCount(testDb)).toBe(0);
  });

  it("counts all pull requests", () => {
    upsertPullRequest(samplePR, testDb);
    upsertPullRequest({ ...samplePR, githubId: 99999, number: 2 }, testDb);

    expect(getPullRequestCount(testDb)).toBe(2);
  });

  it("stores merged_at as null for open PRs", () => {
    const result = upsertPullRequest(samplePR, testDb);
    expect(result.mergedAt).toBeNull();
  });

  it("stores raw_json when not provided as null", () => {
    const result = upsertPullRequest(samplePR, testDb);
    expect(result.rawJson).toBeNull();
  });

  // US-015: getPRsOpenedByMember
  describe("getPRsOpenedByMember", () => {
    beforeEach(() => {
      upsertPullRequest(
        { ...samplePR, githubId: 1, number: 1, author: "alice", createdAt: "2026-02-05T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 2, number: 2, author: "alice", createdAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 3, number: 3, author: "bob", createdAt: "2026-02-15T10:00:00Z" },
        testDb,
      );
      // Outside date range
      upsertPullRequest(
        { ...samplePR, githubId: 4, number: 4, author: "alice", createdAt: "2026-03-05T10:00:00Z" },
        testDb,
      );
      // Not a team member
      upsertPullRequest(
        { ...samplePR, githubId: 5, number: 5, author: "stranger", createdAt: "2026-02-12T10:00:00Z" },
        testDb,
      );
    });

    it("returns correct counts per author within date range", () => {
      const result = getPRsOpenedByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      const alice = result.find((r) => r.author === "alice");
      const bob = result.find((r) => r.author === "bob");
      expect(alice?.count).toBe(2);
      expect(bob?.count).toBe(1);
    });

    it("excludes PRs outside date range", () => {
      const result = getPRsOpenedByMember(
        ["alice"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result.find((r) => r.author === "alice")?.count).toBe(2);
    });

    it("excludes PRs by non-team members", () => {
      const result = getPRsOpenedByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result.find((r) => r.author === "stranger")).toBeUndefined();
    });

    it("returns empty array for empty team list", () => {
      const result = getPRsOpenedByMember(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result).toEqual([]);
    });
  });

  // US-015: getPRsOpenedPerWeek
  describe("getPRsOpenedPerWeek", () => {
    beforeEach(() => {
      // Week 5 (2026): around Feb 2
      upsertPullRequest(
        { ...samplePR, githubId: 10, number: 10, author: "alice", createdAt: "2026-02-02T10:00:00Z" },
        testDb,
      );
      // Week 6 (2026): around Feb 9
      upsertPullRequest(
        { ...samplePR, githubId: 11, number: 11, author: "alice", createdAt: "2026-02-09T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 12, number: 12, author: "bob", createdAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
    });

    it("groups PRs by week correctly", () => {
      const result = getPRsOpenedPerWeek(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
      // Weeks should be ordered
      for (let i = 1; i < result.length; i++) {
        expect(result[i].week >= result[i - 1].week).toBe(true);
      }
    });

    it("returns empty array for empty team list", () => {
      const result = getPRsOpenedPerWeek(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result).toEqual([]);
    });
  });
});
