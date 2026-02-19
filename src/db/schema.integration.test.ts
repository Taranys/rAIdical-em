// US-022: Phase 1 database schema integration tests / US-2.03: Phase 2 schema extension
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

      CREATE TABLE classification_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        comments_processed INTEGER NOT NULL DEFAULT 0,
        errors INTEGER NOT NULL DEFAULT 0,
        model_used TEXT NOT NULL
      );

      CREATE TABLE comment_classifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_type TEXT NOT NULL,
        comment_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        model_used TEXT NOT NULL,
        classification_run_id INTEGER REFERENCES classification_runs(id),
        classified_at TEXT NOT NULL
      );

      CREATE TABLE seniority_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_member_id INTEGER NOT NULL REFERENCES team_members(id),
        dimension_name TEXT NOT NULL,
        dimension_family TEXT NOT NULL,
        maturity_level TEXT NOT NULL,
        last_computed_at TEXT NOT NULL,
        supporting_metrics TEXT
      );

      CREATE TABLE highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_type TEXT NOT NULL,
        comment_id INTEGER NOT NULL,
        highlight_type TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        team_member_id INTEGER NOT NULL REFERENCES team_members(id),
        created_at TEXT NOT NULL
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

  // --- Phase 2 tables (US-2.03) ---

  it("can insert and query classification_runs", () => {
    const now = new Date().toISOString();
    testDb
      .insert(schema.classificationRuns)
      .values({
        startedAt: now,
        status: "success",
        commentsProcessed: 50,
        errors: 2,
        modelUsed: "gpt-4o",
        completedAt: now,
      })
      .run();

    const runs = testDb.select().from(schema.classificationRuns).all();
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("success");
    expect(runs[0].commentsProcessed).toBe(50);
    expect(runs[0].modelUsed).toBe("gpt-4o");
  });

  it("can insert and query comment_classifications with polymorphic reference", () => {
    const now = new Date().toISOString();

    // Create a classification run first
    testDb
      .insert(schema.classificationRuns)
      .values({ startedAt: now, status: "success", modelUsed: "gpt-4o", completedAt: now })
      .run();
    const run = testDb.select().from(schema.classificationRuns).all()[0];

    // Create a PR and review comment to reference
    testDb
      .insert(schema.pullRequests)
      .values({ githubId: 1001, number: 1, title: "PR", author: "a", state: "open", createdAt: now })
      .run();
    const pr = testDb.select().from(schema.pullRequests).all()[0];
    testDb
      .insert(schema.reviewComments)
      .values({ githubId: 3001, pullRequestId: pr.id, reviewer: "r", body: "Fix this", createdAt: now, updatedAt: now })
      .run();
    const comment = testDb.select().from(schema.reviewComments).all()[0];

    // Classify the comment
    testDb
      .insert(schema.commentClassifications)
      .values({
        commentType: "review_comment",
        commentId: comment.id,
        category: "code_quality",
        confidence: 85,
        modelUsed: "gpt-4o",
        classificationRunId: run.id,
        classifiedAt: now,
      })
      .run();

    const classifications = testDb.select().from(schema.commentClassifications).all();
    expect(classifications).toHaveLength(1);
    expect(classifications[0].commentType).toBe("review_comment");
    expect(classifications[0].category).toBe("code_quality");
    expect(classifications[0].confidence).toBe(85);
    expect(classifications[0].classificationRunId).toBe(run.id);
  });

  it("enforces FK on comment_classifications → classification_runs", () => {
    const now = new Date().toISOString();
    expect(() =>
      testDb
        .insert(schema.commentClassifications)
        .values({
          commentType: "review_comment",
          commentId: 1,
          category: "nitpick",
          confidence: 90,
          modelUsed: "gpt-4o",
          classificationRunId: 999,
          classifiedAt: now,
        })
        .run()
    ).toThrow();
  });

  it("can insert and query seniority_profiles", () => {
    const now = new Date().toISOString();

    // Create a team member
    testDb
      .insert(schema.teamMembers)
      .values({ githubUsername: "dev1", displayName: "Dev One", createdAt: now, updatedAt: now })
      .run();
    const member = testDb.select().from(schema.teamMembers).all()[0];

    testDb
      .insert(schema.seniorityProfiles)
      .values({
        teamMemberId: member.id,
        dimensionName: "code_review_depth",
        dimensionFamily: "technical",
        maturityLevel: "experienced",
        lastComputedAt: now,
        supportingMetrics: JSON.stringify({ avgCommentLength: 120, suggestionsRatio: 0.4 }),
      })
      .run();

    const profiles = testDb.select().from(schema.seniorityProfiles).all();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].dimensionFamily).toBe("technical");
    expect(profiles[0].maturityLevel).toBe("experienced");
    expect(JSON.parse(profiles[0].supportingMetrics!)).toHaveProperty("avgCommentLength");
  });

  it("enforces FK on seniority_profiles → team_members", () => {
    const now = new Date().toISOString();
    expect(() =>
      testDb
        .insert(schema.seniorityProfiles)
        .values({
          teamMemberId: 999,
          dimensionName: "mentoring",
          dimensionFamily: "soft_skill",
          maturityLevel: "senior",
          lastComputedAt: now,
        })
        .run()
    ).toThrow();
  });

  it("can insert and query highlights", () => {
    const now = new Date().toISOString();

    // Create a team member
    testDb
      .insert(schema.teamMembers)
      .values({ githubUsername: "dev2", displayName: "Dev Two", createdAt: now, updatedAt: now })
      .run();
    const member = testDb.select().from(schema.teamMembers).all()[0];

    // Create a PR + pr_comment to reference
    testDb
      .insert(schema.pullRequests)
      .values({ githubId: 2001, number: 2, title: "PR2", author: "dev2", state: "merged", createdAt: now })
      .run();
    const pr = testDb.select().from(schema.pullRequests).all()[0];
    testDb
      .insert(schema.prComments)
      .values({ githubId: 5001, pullRequestId: pr.id, author: "dev2", body: "Great insight", createdAt: now, updatedAt: now })
      .run();
    const comment = testDb.select().from(schema.prComments).all()[0];

    testDb
      .insert(schema.highlights)
      .values({
        commentType: "pr_comment",
        commentId: comment.id,
        highlightType: "best_comment",
        reasoning: "Shows deep understanding of system architecture",
        teamMemberId: member.id,
        createdAt: now,
      })
      .run();

    const rows = testDb.select().from(schema.highlights).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].highlightType).toBe("best_comment");
    expect(rows[0].reasoning).toContain("deep understanding");
    expect(rows[0].teamMemberId).toBe(member.id);
  });

  it("enforces FK on highlights → team_members", () => {
    const now = new Date().toISOString();
    expect(() =>
      testDb
        .insert(schema.highlights)
        .values({
          commentType: "review_comment",
          commentId: 1,
          highlightType: "growth_opportunity",
          reasoning: "Could improve error handling",
          teamMemberId: 999,
          createdAt: now,
        })
        .run()
    ).toThrow();
  });

  it("creates all 11 tables", () => {
    const result = testSqlite
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'")
      .get() as { count: number };
    expect(result.count).toBe(11);
  });
});
