// US-022: Phase 1 database schema integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

describe("Phase 1 schema (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testSqlite.pragma("foreign_keys = ON");
    testDb = drizzle(testSqlite, { schema });

    // Create all tables via raw SQL matching the Drizzle schema
    testSqlite.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        color TEXT NOT NULL DEFAULT '#E25A3B',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

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

      CREATE TABLE pr_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

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

  it("can insert and query settings", () => {
    testDb
      .insert(schema.settings)
      .values({ key: "github_pat", value: "ghp_test123", updatedAt: new Date().toISOString() })
      .run();

    const rows = testDb.select().from(schema.settings).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("github_pat");
    expect(rows[0].value).toBe("ghp_test123");
  });

  it("can insert and query team members", () => {
    const now = new Date().toISOString();
    testDb
      .insert(schema.teamMembers)
      .values({
        githubUsername: "octocat",
        displayName: "Octo Cat",
        avatarUrl: "https://github.com/octocat.png",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const rows = testDb.select().from(schema.teamMembers).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].githubUsername).toBe("octocat");
    expect(rows[0].isActive).toBe(1);
  });

  it("enforces unique github_username on team_members", () => {
    const now = new Date().toISOString();
    const values = { githubUsername: "octocat", displayName: "Octo", createdAt: now, updatedAt: now };
    testDb.insert(schema.teamMembers).values(values).run();

    expect(() => testDb.insert(schema.teamMembers).values(values).run()).toThrow();
  });

  it("can insert pull requests and linked reviews", () => {
    const now = new Date().toISOString();
    testDb
      .insert(schema.pullRequests)
      .values({
        githubId: 1001,
        number: 42,
        title: "Add feature",
        author: "octocat",
        state: "merged",
        createdAt: now,
        mergedAt: now,
        additions: 100,
        deletions: 20,
        changedFiles: 5,
      })
      .run();

    const prs = testDb.select().from(schema.pullRequests).all();
    expect(prs).toHaveLength(1);

    testDb
      .insert(schema.reviews)
      .values({
        githubId: 2001,
        pullRequestId: prs[0].id,
        reviewer: "reviewer1",
        state: "APPROVED",
        submittedAt: now,
      })
      .run();

    const reviews = testDb.select().from(schema.reviews).all();
    expect(reviews).toHaveLength(1);
    expect(reviews[0].pullRequestId).toBe(prs[0].id);
  });

  it("enforces foreign key on reviews → pull_requests", () => {
    expect(() =>
      testDb
        .insert(schema.reviews)
        .values({
          githubId: 2001,
          pullRequestId: 999,
          reviewer: "reviewer1",
          state: "APPROVED",
          submittedAt: new Date().toISOString(),
        })
        .run()
    ).toThrow();
  });

  it("can insert review_comments and pr_comments", () => {
    const now = new Date().toISOString();
    testDb
      .insert(schema.pullRequests)
      .values({ githubId: 1001, number: 1, title: "PR", author: "a", state: "open", createdAt: now })
      .run();
    const pr = testDb.select().from(schema.pullRequests).all()[0];

    testDb
      .insert(schema.reviewComments)
      .values({
        githubId: 3001,
        pullRequestId: pr.id,
        reviewer: "reviewer1",
        body: "Looks good",
        filePath: "src/index.ts",
        line: 10,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    testDb
      .insert(schema.prComments)
      .values({
        githubId: 4001,
        pullRequestId: pr.id,
        author: "commenter1",
        body: "Nice work!",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    expect(testDb.select().from(schema.reviewComments).all()).toHaveLength(1);
    expect(testDb.select().from(schema.prComments).all()).toHaveLength(1);
  });

  it("can insert and query sync_runs per repository", () => {
    const now = new Date().toISOString();
    testDb
      .insert(schema.syncRuns)
      .values({
        repository: "octocat/hello-world",
        startedAt: now,
        status: "success",
        prCount: 42,
        commentCount: 100,
        completedAt: now,
      })
      .run();

    const runs = testDb.select().from(schema.syncRuns).all();
    expect(runs).toHaveLength(1);
    expect(runs[0].repository).toBe("octocat/hello-world");
    expect(runs[0].prCount).toBe(42);
  });

  it("creates all 7 tables", () => {
    const result = testSqlite
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'")
      .get() as { count: number };
    expect(result.count).toBe(7);
  });
});
