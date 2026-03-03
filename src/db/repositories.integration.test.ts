// Multi-repo support: repositories data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { createRepository, listRepositories, findRepositoryById, findRepositoryByOwnerName, deleteRepositoryWithCascade } from "./repositories";

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

  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

describe("repositories data access layer (integration)", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const testDb = createTestDb();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  afterEach(() => {
    sqlite.close();
  });

  describe("createRepository", () => {
    it("creates a repository and returns it", () => {
      const repo = createRepository({ owner: "acme", name: "frontend" }, db);
      expect(repo.id).toBeDefined();
      expect(repo.owner).toBe("acme");
      expect(repo.name).toBe("frontend");
      expect(repo.addedAt).toBeDefined();
    });

    it("throws on duplicate owner/name", () => {
      createRepository({ owner: "acme", name: "api" }, db);
      expect(() => createRepository({ owner: "acme", name: "api" }, db)).toThrow();
    });
  });

  describe("listRepositories", () => {
    it("returns repos sorted by addedAt ascending", () => {
      createRepository({ owner: "acme", name: "api" }, db);
      createRepository({ owner: "acme", name: "frontend" }, db);

      const repos = listRepositories(db);
      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe("api");
      expect(repos[1].name).toBe("frontend");
    });

    it("returns empty array when no repos", () => {
      expect(listRepositories(db)).toEqual([]);
    });
  });

  describe("findRepositoryById", () => {
    it("returns the repo when found", () => {
      const created = createRepository({ owner: "acme", name: "api" }, db);
      const found = findRepositoryById(created.id, db);
      expect(found).toBeDefined();
      expect(found!.owner).toBe("acme");
    });

    it("returns undefined when not found", () => {
      expect(findRepositoryById(999, db)).toBeUndefined();
    });
  });

  describe("findRepositoryByOwnerName", () => {
    it("returns the repo when found", () => {
      createRepository({ owner: "acme", name: "api" }, db);
      const found = findRepositoryByOwnerName("acme", "api", db);
      expect(found).toBeDefined();
      expect(found!.name).toBe("api");
    });

    it("returns undefined when not found", () => {
      expect(findRepositoryByOwnerName("acme", "nope", db)).toBeUndefined();
    });
  });

  describe("deleteRepositoryWithCascade", () => {
    it("deletes repo and all linked data", () => {
      const now = new Date().toISOString();
      const repo = createRepository({ owner: "acme", name: "api" }, db);

      // Add linked data
      sqlite.prepare("INSERT INTO pull_requests (github_id, number, title, author, state, created_at, repository_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(1001, 1, "PR1", "dev1", "merged", now, repo.id);
      const prId = (sqlite.prepare("SELECT id FROM pull_requests").get() as { id: number }).id;

      sqlite.prepare("INSERT INTO reviews (github_id, pull_request_id, reviewer, state, submitted_at, repository_id) VALUES (?, ?, ?, ?, ?, ?)")
        .run(2001, prId, "rev1", "APPROVED", now, repo.id);
      sqlite.prepare("INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at, repository_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(3001, prId, "rev1", "LGTM", now, now, repo.id);
      sqlite.prepare("INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at, repository_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(4001, prId, "dev1", "Done", now, now, repo.id);
      sqlite.prepare("INSERT INTO sync_runs (repository, started_at, status, repository_id) VALUES (?, ?, ?, ?)")
        .run("acme/api", now, "success", repo.id);

      const deleted = deleteRepositoryWithCascade(repo.id, sqlite);
      expect(deleted).toBe(true);

      // Verify everything is gone
      expect(findRepositoryById(repo.id, db)).toBeUndefined();
      expect((sqlite.prepare("SELECT count(*) as c FROM pull_requests").get() as { c: number }).c).toBe(0);
      expect((sqlite.prepare("SELECT count(*) as c FROM reviews").get() as { c: number }).c).toBe(0);
      expect((sqlite.prepare("SELECT count(*) as c FROM review_comments").get() as { c: number }).c).toBe(0);
      expect((sqlite.prepare("SELECT count(*) as c FROM pr_comments").get() as { c: number }).c).toBe(0);
      expect((sqlite.prepare("SELECT count(*) as c FROM sync_runs").get() as { c: number }).c).toBe(0);
    });

    it("returns false for non-existent repo", () => {
      const deleted = deleteRepositoryWithCascade(999, sqlite);
      expect(deleted).toBe(false);
    });
  });
});
