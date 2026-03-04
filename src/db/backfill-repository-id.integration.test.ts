// Multi-repo support: backfill repositoryId integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { backfillRepositoryId } from "./backfill-repository-id";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      added_at TEXT NOT NULL,
      UNIQUE(owner, name)
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
      classification_reason TEXT,
      raw_json TEXT,
      repository_id INTEGER REFERENCES repositories(id)
    );

    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id INTEGER NOT NULL UNIQUE,
      pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
      reviewer TEXT NOT NULL,
      state TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      repository_id INTEGER REFERENCES repositories(id)
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
      updated_at TEXT NOT NULL,
      repository_id INTEGER REFERENCES repositories(id)
    );

    CREATE TABLE pr_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id INTEGER NOT NULL UNIQUE,
      pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      repository_id INTEGER REFERENCES repositories(id)
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
      error_message TEXT,
      repository_id INTEGER REFERENCES repositories(id)
    );
  `);

  return sqlite;
}

describe("backfillRepositoryId", () => {
  let sqlite: InstanceType<typeof Database>;

  beforeEach(() => {
    sqlite = createTestDb();
  });

  afterEach(() => {
    sqlite.close();
  });

  it("backfills existing data when github_owner and github_repo are configured", () => {
    const now = new Date().toISOString();

    // Set up settings
    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_owner", "acme", now);
    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_repo", "frontend", now);

    // Insert existing data without repository_id
    sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(1001, 1, "PR1", "dev1", "merged", now);
    const prId = (sqlite.prepare("SELECT id FROM pull_requests").get() as { id: number }).id;

    sqlite.prepare("INSERT INTO reviews (github_id, pull_request_id, reviewer, state, submitted_at) VALUES (?, ?, ?, ?, ?)")
      .run(2001, prId, "rev1", "APPROVED", now);

    sqlite.prepare("INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(3001, prId, "rev1", "LGTM", now, now);

    sqlite.prepare("INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(4001, prId, "dev1", "Ready", now, now);

    sqlite.prepare("INSERT INTO sync_runs (repository, started_at, status) VALUES (?, ?, ?)")
      .run("acme/frontend", now, "success");

    // Run backfill
    backfillRepositoryId(sqlite);

    // Verify repository was created
    const repos = sqlite.prepare("SELECT * FROM repositories").all() as { id: number; owner: string; name: string }[];
    expect(repos).toHaveLength(1);
    expect(repos[0].owner).toBe("acme");
    expect(repos[0].name).toBe("frontend");

    const repoId = repos[0].id;

    // Verify all tables got backfilled
    const pr = sqlite.prepare("SELECT repository_id FROM pull_requests").get() as { repository_id: number };
    expect(pr.repository_id).toBe(repoId);

    const review = sqlite.prepare("SELECT repository_id FROM reviews").get() as { repository_id: number };
    expect(review.repository_id).toBe(repoId);

    const reviewComment = sqlite.prepare("SELECT repository_id FROM review_comments").get() as { repository_id: number };
    expect(reviewComment.repository_id).toBe(repoId);

    const prComment = sqlite.prepare("SELECT repository_id FROM pr_comments").get() as { repository_id: number };
    expect(prComment.repository_id).toBe(repoId);

    const syncRun = sqlite.prepare("SELECT repository_id FROM sync_runs").get() as { repository_id: number };
    expect(syncRun.repository_id).toBe(repoId);
  });

  it("does nothing when no github_owner or github_repo settings exist", () => {
    const now = new Date().toISOString();

    sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(1001, 1, "PR1", "dev1", "merged", now);

    backfillRepositoryId(sqlite);

    const repos = sqlite.prepare("SELECT * FROM repositories").all();
    expect(repos).toHaveLength(0);

    const pr = sqlite.prepare("SELECT repository_id FROM pull_requests").get() as { repository_id: number | null };
    expect(pr.repository_id).toBeNull();
  });

  it("is idempotent — running twice does not create duplicate repos", () => {
    const now = new Date().toISOString();

    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_owner", "acme", now);
    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_repo", "api", now);

    sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(1001, 1, "PR1", "dev1", "merged", now);

    backfillRepositoryId(sqlite);
    backfillRepositoryId(sqlite);

    const repos = sqlite.prepare("SELECT * FROM repositories").all();
    expect(repos).toHaveLength(1);
  });

  it("does not overwrite existing repository_id values", () => {
    const now = new Date().toISOString();

    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_owner", "acme", now);
    sqlite.prepare("INSERT INTO settings VALUES (?, ?, ?)").run("github_repo", "api", now);

    // Create a different repo first
    sqlite.prepare("INSERT INTO repositories (owner, name, added_at) VALUES (?, ?, ?)").run("other", "repo", now);
    const otherRepoId = (sqlite.prepare("SELECT id FROM repositories WHERE owner = 'other'").get() as { id: number }).id;

    // Insert PR already linked to other repo
    sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at, repository_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(1001, 1, "PR1", "dev1", "merged", now, otherRepoId);

    // Insert PR without repo
    sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(1002, 2, "PR2", "dev2", "open", now);

    backfillRepositoryId(sqlite);

    const prs = sqlite.prepare("SELECT github_id, repository_id FROM pull_requests ORDER BY github_id").all() as { github_id: number; repository_id: number }[];
    expect(prs[0].repository_id).toBe(otherRepoId); // unchanged
    expect(prs[1].repository_id).not.toBe(otherRepoId); // backfilled with acme/api
  });
});
