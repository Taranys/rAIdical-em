// US-010: Pull requests data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  upsertPullRequest,
  getPullRequestCount,
  getPRsMergedByMember,
  getPRsMergedPerWeek,
  getAvgPRSizeByMember,
  getPRsByMember,
  getAiRatioByMember,
  getAiRatioTeamTotal,
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
        ai_generated TEXT NOT NULL DEFAULT 'human',
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

  // getPRsMergedByMember
  describe("getPRsMergedByMember", () => {
    const mergedPR = { ...samplePR, state: "merged" as const };

    beforeEach(() => {
      upsertPullRequest(
        { ...mergedPR, githubId: 1, number: 1, author: "alice", createdAt: "2026-01-20T10:00:00Z", mergedAt: "2026-02-05T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...mergedPR, githubId: 2, number: 2, author: "alice", createdAt: "2026-01-25T10:00:00Z", mergedAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...mergedPR, githubId: 3, number: 3, author: "bob", createdAt: "2026-02-01T10:00:00Z", mergedAt: "2026-02-15T10:00:00Z" },
        testDb,
      );
      // Merged outside date range
      upsertPullRequest(
        { ...mergedPR, githubId: 4, number: 4, author: "alice", createdAt: "2026-02-20T10:00:00Z", mergedAt: "2026-03-05T10:00:00Z" },
        testDb,
      );
      // Not merged (open PR)
      upsertPullRequest(
        { ...samplePR, githubId: 5, number: 5, author: "alice", createdAt: "2026-02-12T10:00:00Z", mergedAt: null },
        testDb,
      );
      // Not a team member
      upsertPullRequest(
        { ...mergedPR, githubId: 6, number: 6, author: "stranger", createdAt: "2026-02-01T10:00:00Z", mergedAt: "2026-02-12T10:00:00Z" },
        testDb,
      );
    });

    it("returns correct counts per author within date range", () => {
      const result = getPRsMergedByMember(
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

    it("excludes PRs merged outside date range", () => {
      const result = getPRsMergedByMember(
        ["alice"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result.find((r) => r.author === "alice")?.count).toBe(2);
    });

    it("excludes non-merged PRs", () => {
      // alice has 3 total PRs in range but only 2 are merged
      const result = getPRsMergedByMember(
        ["alice"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result.find((r) => r.author === "alice")?.count).toBe(2);
    });

    it("excludes PRs by non-team members", () => {
      const result = getPRsMergedByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result.find((r) => r.author === "stranger")).toBeUndefined();
    });

    it("returns empty array for empty team list", () => {
      const result = getPRsMergedByMember(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result).toEqual([]);
    });
  });

  // getPRsMergedPerWeek
  describe("getPRsMergedPerWeek", () => {
    const mergedPR = { ...samplePR, state: "merged" as const };

    beforeEach(() => {
      // Merged in week 5 (2026): around Feb 2
      upsertPullRequest(
        { ...mergedPR, githubId: 10, number: 10, author: "alice", createdAt: "2026-01-20T10:00:00Z", mergedAt: "2026-02-02T10:00:00Z" },
        testDb,
      );
      // Merged in week 6 (2026): around Feb 9
      upsertPullRequest(
        { ...mergedPR, githubId: 11, number: 11, author: "alice", createdAt: "2026-01-25T10:00:00Z", mergedAt: "2026-02-09T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...mergedPR, githubId: 12, number: 12, author: "bob", createdAt: "2026-02-01T10:00:00Z", mergedAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
    });

    it("groups PRs by merge week correctly", () => {
      const result = getPRsMergedPerWeek(
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
      const result = getPRsMergedPerWeek(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(result).toEqual([]);
    });
  });

  // US-016: getAvgPRSizeByMember
  describe("getAvgPRSizeByMember", () => {
    beforeEach(() => {
      upsertPullRequest(
        { ...samplePR, githubId: 20, number: 20, author: "alice", additions: 100, deletions: 20, createdAt: "2026-02-05T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 21, number: 21, author: "alice", additions: 200, deletions: 40, createdAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 22, number: 22, author: "bob", additions: 50, deletions: 10, createdAt: "2026-02-15T10:00:00Z" },
        testDb,
      );
    });

    it("returns correct averages per author", () => {
      const result = getAvgPRSizeByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      const alice = result.find((r) => r.author === "alice");
      expect(alice?.avgAdditions).toBe(150); // (100+200)/2
      expect(alice?.avgDeletions).toBe(30); // (20+40)/2
      expect(alice?.prCount).toBe(2);

      const bob = result.find((r) => r.author === "bob");
      expect(bob?.avgAdditions).toBe(50);
      expect(bob?.prCount).toBe(1);
    });

    it("returns empty for empty team list", () => {
      expect(getAvgPRSizeByMember([], "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z", testDb)).toEqual([]);
    });
  });

  // US-016: getPRsByMember
  describe("getPRsByMember", () => {
    beforeEach(() => {
      upsertPullRequest(
        { ...samplePR, githubId: 30, number: 30, author: "alice", additions: 100, deletions: 20, changedFiles: 5, createdAt: "2026-02-05T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 31, number: 31, author: "alice", additions: 200, deletions: 40, changedFiles: 8, createdAt: "2026-02-10T10:00:00Z" },
        testDb,
      );
      upsertPullRequest(
        { ...samplePR, githubId: 32, number: 32, author: "bob", additions: 50, deletions: 10, createdAt: "2026-02-15T10:00:00Z" },
        testDb,
      );
    });

    it("returns PRs for a specific author ordered by date DESC", () => {
      const result = getPRsByMember("alice", "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z", testDb);

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(31); // More recent first
      expect(result[1].number).toBe(30);
      expect(result[0].additions).toBe(200);
      expect(result[0].changedFiles).toBe(8);
    });

    it("does not return PRs from other authors", () => {
      const result = getPRsByMember("alice", "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z", testDb);
      expect(result.every((pr) => pr.number !== 32)).toBe(true);
    });
  });

  // US-021: getAiRatioByMember / getAiRatioTeamTotal
  describe("getAiRatioByMember / getAiRatioTeamTotal", () => {
    beforeEach(() => {
      // alice: 2 human, 1 ai, 1 mixed
      testSqlite.exec(`
        INSERT INTO pull_requests (github_id, number, title, author, state, created_at, ai_generated)
        VALUES
          (100, 100, 'PR1', 'alice', 'merged', '2026-02-05T10:00:00Z', 'human'),
          (101, 101, 'PR2', 'alice', 'merged', '2026-02-06T10:00:00Z', 'human'),
          (102, 102, 'PR3', 'alice', 'merged', '2026-02-07T10:00:00Z', 'ai'),
          (103, 103, 'PR4', 'alice', 'merged', '2026-02-08T10:00:00Z', 'mixed');
      `);
      // bob: 1 human, 2 ai
      testSqlite.exec(`
        INSERT INTO pull_requests (github_id, number, title, author, state, created_at, ai_generated)
        VALUES
          (200, 200, 'PR5', 'bob', 'merged', '2026-02-10T10:00:00Z', 'human'),
          (201, 201, 'PR6', 'bob', 'merged', '2026-02-11T10:00:00Z', 'ai'),
          (202, 202, 'PR7', 'bob', 'merged', '2026-02-12T10:00:00Z', 'ai');
      `);
      // stranger (not team) and outside range
      testSqlite.exec(`
        INSERT INTO pull_requests (github_id, number, title, author, state, created_at, ai_generated)
        VALUES
          (300, 300, 'PR8', 'stranger', 'merged', '2026-02-15T10:00:00Z', 'ai'),
          (301, 301, 'PR9', 'alice', 'merged', '2026-03-05T10:00:00Z', 'ai');
      `);
    });

    it("returns correct AI ratio per member", () => {
      const result = getAiRatioByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      const aliceHuman = result.find((r) => r.author === "alice" && r.aiGenerated === "human");
      const aliceAi = result.find((r) => r.author === "alice" && r.aiGenerated === "ai");
      const aliceMixed = result.find((r) => r.author === "alice" && r.aiGenerated === "mixed");
      const bobHuman = result.find((r) => r.author === "bob" && r.aiGenerated === "human");
      const bobAi = result.find((r) => r.author === "bob" && r.aiGenerated === "ai");

      expect(aliceHuman?.count).toBe(2);
      expect(aliceAi?.count).toBe(1);
      expect(aliceMixed?.count).toBe(1);
      expect(bobHuman?.count).toBe(1);
      expect(bobAi?.count).toBe(2);
    });

    it("returns correct team totals", () => {
      const result = getAiRatioTeamTotal(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      const human = result.find((r) => r.aiGenerated === "human");
      const ai = result.find((r) => r.aiGenerated === "ai");
      const mixed = result.find((r) => r.aiGenerated === "mixed");

      expect(human?.count).toBe(3); // alice 2 + bob 1
      expect(ai?.count).toBe(3); // alice 1 + bob 2
      expect(mixed?.count).toBe(1); // alice 1
    });

    it("excludes non-team members and out-of-range PRs", () => {
      const result = getAiRatioByMember(
        ["alice", "bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      expect(result.find((r) => r.author === "stranger")).toBeUndefined();
      // alice should have 4 total (not 5 — the out-of-range one is excluded)
      const aliceTotal = result
        .filter((r) => r.author === "alice")
        .reduce((sum, r) => sum + r.count, 0);
      expect(aliceTotal).toBe(4);
    });

    it("returns empty array for empty team list", () => {
      expect(getAiRatioByMember([], "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z", testDb)).toEqual([]);
      expect(getAiRatioTeamTotal([], "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z", testDb)).toEqual([]);
    });
  });
});
