// US-2.05: Comment classifications DAL integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getUnclassifiedReviewComments,
  getUnclassifiedPrComments,
  insertClassification,
  getClassificationSummary,
} from "./comment-classifications";

describe("comment-classifications DAL (integration)", () => {
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
      CREATE TABLE pr_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER NOT NULL UNIQUE,
        pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id),
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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
      CREATE INDEX idx_comment_classifications_comment ON comment_classifications(comment_type, comment_id);
      CREATE INDEX idx_comment_classifications_category ON comment_classifications(category);
      CREATE INDEX idx_comment_classifications_run_id ON comment_classifications(classification_run_id);
    `);

    // Seed a PR
    testSqlite.exec(`
      INSERT INTO pull_requests (github_id, number, title, author, state, created_at)
      VALUES (1001, 1, 'Add feature X', 'alice', 'merged', '2026-02-01T10:00:00Z');
    `);

    // Seed a classification run
    testSqlite.exec(`
      INSERT INTO classification_runs (started_at, status, model_used)
      VALUES ('2026-02-23T10:00:00Z', 'running', 'claude-haiku');
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  describe("getUnclassifiedReviewComments", () => {
    it("returns review comments without a classification", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'This might cause an NPE', 'src/app.ts', 42, '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2002, 1, 'bob', 'Looks good', NULL, NULL, '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z');
      `);

      const results = getUnclassifiedReviewComments(testDb);

      expect(results).toHaveLength(2);
      expect(results[0].commentType).toBe("review_comment");
      expect(results[0].body).toBe("This might cause an NPE");
      expect(results[0].filePath).toBe("src/app.ts");
      expect(results[0].prTitle).toBe("Add feature X");
    });

    it("excludes already classified review comments", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Classified comment', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2002, 1, 'bob', 'Unclassified comment', '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z');
      `);
      // Classify the first one
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 1, 'bug_correctness', 90, 'claude-haiku', 1, '2026-02-23T10:01:00Z');
      `);

      const results = getUnclassifiedReviewComments(testDb);

      expect(results).toHaveLength(1);
      expect(results[0].commentId).toBe(2);
    });

    it("returns empty array when all comments are classified", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Comment', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 1, 'nitpick_style', 70, 'claude-haiku', 1, '2026-02-23T10:01:00Z');
      `);

      const results = getUnclassifiedReviewComments(testDb);
      expect(results).toHaveLength(0);
    });
  });

  describe("getUnclassifiedPrComments", () => {
    it("returns PR comments without a classification", () => {
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'alice', 'LGTM', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);

      const results = getUnclassifiedPrComments(testDb);

      expect(results).toHaveLength(1);
      expect(results[0].commentType).toBe("pr_comment");
      expect(results[0].body).toBe("LGTM");
      expect(results[0].filePath).toBeNull();
      expect(results[0].prTitle).toBe("Add feature X");
    });

    it("excludes already classified PR comments", () => {
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'alice', 'LGTM', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'question_clarification', 20, 'claude-haiku', 1, '2026-02-23T10:01:00Z');
      `);

      const results = getUnclassifiedPrComments(testDb);
      expect(results).toHaveLength(0);
    });
  });

  describe("insertClassification", () => {
    it("inserts a classification result", () => {
      const result = insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "bug_correctness",
          confidence: 90,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      expect(result.id).toBe(1);
      expect(result.commentType).toBe("review_comment");
      expect(result.commentId).toBe(1);
      expect(result.category).toBe("bug_correctness");
      expect(result.confidence).toBe(90);
      expect(result.classifiedAt).toBeTruthy();
    });
  });

  describe("getClassificationSummary", () => {
    it("returns category breakdown and average confidence for a run", () => {
      // Insert some classifications
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "bug_correctness",
          confidence: 90,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 2,
          category: "bug_correctness",
          confidence: 80,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );
      insertClassification(
        {
          commentType: "pr_comment",
          commentId: 3,
          category: "nitpick_style",
          confidence: 60,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      const summary = getClassificationSummary(1, testDb);

      expect(summary.totalClassified).toBe(3);
      expect(summary.averageConfidence).toBe(77); // Math.round((90+80+60)/3)
      expect(summary.categories).toHaveLength(2);

      const bugCat = summary.categories.find(
        (c) => c.category === "bug_correctness",
      );
      const nitpickCat = summary.categories.find(
        (c) => c.category === "nitpick_style",
      );
      expect(bugCat?.count).toBe(2);
      expect(nitpickCat?.count).toBe(1);
    });

    it("returns empty summary for a run with no classifications", () => {
      const summary = getClassificationSummary(1, testDb);

      expect(summary.totalClassified).toBe(0);
      expect(summary.averageConfidence).toBe(0);
      expect(summary.categories).toHaveLength(0);
    });
  });
});
