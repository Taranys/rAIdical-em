// US-2.05 / US-2.07 / US-2.08 / US-2.09: Comment classifications DAL integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getUnclassifiedReviewComments,
  getUnclassifiedPrComments,
  insertClassification,
  updateClassification,
  getClassificationSummary,
  getClassifiedComments,
  getCategoryDistribution,
  getCategoryDistributionFiltered,
  getCategoryTrendByWeek,
  getTopClassifiedCommentsByMember,
  getCategoryDistributionByReviewer,
  getLowDepthCommentsByMember,
} from "./comment-classifications";

describe("comment-classifications DAL (integration)", () => {
  let testSqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    testSqlite = new Database(":memory:");
    testSqlite.pragma("journal_mode = WAL");
    testDb = drizzle(testSqlite, { schema });

    testSqlite.exec(`
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
        classified_at TEXT NOT NULL,
        reasoning TEXT,
        is_manual INTEGER NOT NULL DEFAULT 0
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

    // US-2.07: reasoning persistence
    it("stores reasoning when provided", () => {
      const result = insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "bug_correctness",
          confidence: 90,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
          reasoning: "This comment points out a null pointer issue",
        },
        testDb,
      );

      expect(result.reasoning).toBe("This comment points out a null pointer issue");
    });

    it("stores null reasoning when not provided", () => {
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

      expect(result.reasoning).toBeNull();
    });
  });

  // US-2.16: updateClassification tests
  describe("updateClassification", () => {
    it("updates an existing classification to a new category with manual flag", () => {
      // Insert a review comment
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Some comment', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      // Insert an LLM classification
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "nitpick_style",
          confidence: 70,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
          reasoning: "Seems like a nitpick",
        },
        testDb,
      );

      // Manually reclassify
      const result = updateClassification("review_comment", 1, "bug_correctness", testDb);

      expect(result).toBeDefined();
      expect(result!.category).toBe("bug_correctness");
      expect(result!.confidence).toBe(100);
      expect(result!.modelUsed).toBe("manual");
      expect(result!.isManual).toBe(1);
      expect(result!.reasoning).toBeNull();
      expect(result!.classificationRunId).toBeNull();
    });

    it("returns undefined when classification does not exist", () => {
      const result = updateClassification("review_comment", 999, "security", testDb);
      expect(result).toBeUndefined();
    });

    it("does not affect other classifications", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Comment A', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2002, 1, 'bob', 'Comment B', '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z');
      `);

      insertClassification(
        { commentType: "review_comment", commentId: 1, category: "nitpick_style", confidence: 70, modelUsed: "claude-haiku", classificationRunId: 1 },
        testDb,
      );
      insertClassification(
        { commentType: "review_comment", commentId: 2, category: "performance", confidence: 80, modelUsed: "claude-haiku", classificationRunId: 1 },
        testDb,
      );

      updateClassification("review_comment", 1, "security", testDb);

      // Comment 2 should be unchanged
      const comments = getClassifiedComments({}, {}, testDb);
      const comment2 = comments.find((c) => c.commentId === 2 && c.commentType === "review_comment");
      expect(comment2?.category).toBe("performance");
      expect(comment2?.isManual).toBe(false);
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

  // US-2.07: getClassifiedComments tests
  describe("getClassifiedComments", () => {
    beforeEach(() => {
      // Seed review comments
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'This might cause an NPE', 'src/app.ts', 42, '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2002, 1, 'carol', 'Looks good', NULL, NULL, '2026-02-03T10:00:00Z', '2026-02-03T10:00:00Z');
      `);
      // Seed a PR comment
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'LGTM', '2026-02-04T10:00:00Z', '2026-02-04T10:00:00Z');
      `);
      // Classify only the first review comment
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "bug_correctness",
          confidence: 90,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
          reasoning: "Points out a null pointer issue",
        },
        testDb,
      );
    });

    it("returns all comments (both types) with classification data joined", () => {
      const results = getClassifiedComments({}, {}, testDb);

      expect(results).toHaveLength(3);
      // Classified comment has category data
      const classified = results.find(
        (c) => c.commentType === "review_comment" && c.commentId === 1,
      );
      expect(classified?.category).toBe("bug_correctness");
      expect(classified?.confidence).toBe(90);
      expect(classified?.reasoning).toBe("Points out a null pointer issue");
      expect(classified?.isManual).toBe(false);
    });

    // US-2.16: isManual flag in getClassifiedComments
    it("returns isManual=true for manually reclassified comments", () => {
      updateClassification("review_comment", 1, "security", testDb);

      const results = getClassifiedComments({}, {}, testDb);
      const reclassified = results.find(
        (c) => c.commentType === "review_comment" && c.commentId === 1,
      );
      expect(reclassified?.category).toBe("security");
      expect(reclassified?.isManual).toBe(true);
      expect(reclassified?.confidence).toBe(100);
    });

    it("returns unclassified comments with null classification fields", () => {
      const results = getClassifiedComments({}, {}, testDb);

      const unclassified = results.find(
        (c) => c.commentType === "review_comment" && c.commentId === 2,
      );
      expect(unclassified?.category).toBeNull();
      expect(unclassified?.confidence).toBeNull();
      expect(unclassified?.reasoning).toBeNull();
    });

    it("filters by category", () => {
      const results = getClassifiedComments(
        { category: "bug_correctness" },
        {},
        testDb,
      );

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("bug_correctness");
    });

    it("filters by reviewer", () => {
      const results = getClassifiedComments(
        { reviewer: "bob" },
        {},
        testDb,
      );

      expect(results).toHaveLength(2); // 1 review_comment + 1 pr_comment from bob
      expect(results.every((c) => c.reviewer === "bob")).toBe(true);
    });

    it("filters by date range", () => {
      const results = getClassifiedComments(
        {
          dateStart: "2026-02-03T00:00:00Z",
          dateEnd: "2026-02-03T23:59:59Z",
        },
        {},
        testDb,
      );

      expect(results).toHaveLength(1);
      expect(results[0].reviewer).toBe("carol");
    });

    it("filters by minimum confidence", () => {
      // Classify the pr_comment too with low confidence
      insertClassification(
        {
          commentType: "pr_comment",
          commentId: 1,
          category: "question_clarification",
          confidence: 20,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      const results = getClassifiedComments(
        { minConfidence: 50 },
        {},
        testDb,
      );

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(90);
    });

    it("sorts by date descending by default", () => {
      const results = getClassifiedComments({}, {}, testDb);

      expect(results[0].createdAt).toBe("2026-02-04T10:00:00Z");
      expect(results[results.length - 1].createdAt).toBe(
        "2026-02-02T10:00:00Z",
      );
    });

    it("sorts by confidence ascending", () => {
      // Classify remaining comments
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 2,
          category: "nitpick_style",
          confidence: 50,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );
      insertClassification(
        {
          commentType: "pr_comment",
          commentId: 1,
          category: "question_clarification",
          confidence: 20,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      const results = getClassifiedComments(
        {},
        { sortBy: "confidence", sortOrder: "asc" },
        testDb,
      );

      expect(results[0].confidence).toBe(20);
      expect(results[1].confidence).toBe(50);
      expect(results[2].confidence).toBe(90);
    });

    it("sorts by category", () => {
      insertClassification(
        {
          commentType: "review_comment",
          commentId: 2,
          category: "nitpick_style",
          confidence: 50,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      const results = getClassifiedComments(
        {},
        { sortBy: "category", sortOrder: "asc" },
        testDb,
      );

      // Classified results should be sorted: bug_correctness < nitpick_style < null (unclassified)
      const classifiedResults = results.filter((c) => c.category !== null);
      expect(classifiedResults[0].category).toBe("bug_correctness");
      expect(classifiedResults[1].category).toBe("nitpick_style");
    });
  });

  // US-2.07: getCategoryDistribution tests
  describe("getCategoryDistribution", () => {
    it("returns correct counts per category", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Comment 1', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2002, 1, 'bob', 'Comment 2', '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z');
      `);

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

      const result = getCategoryDistribution(testDb);

      expect(result.classified).toHaveLength(1);
      expect(result.classified[0].category).toBe("bug_correctness");
      expect(result.classified[0].count).toBe(1);
      expect(result.unclassifiedCount).toBe(1);
    });

    it("returns zero unclassified when all are classified", () => {
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'Comment 1', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);

      insertClassification(
        {
          commentType: "review_comment",
          commentId: 1,
          category: "security",
          confidence: 80,
          modelUsed: "claude-haiku",
          classificationRunId: 1,
        },
        testDb,
      );

      const result = getCategoryDistribution(testDb);

      expect(result.unclassifiedCount).toBe(0);
      expect(result.classified[0].count).toBe(1);
    });

    it("returns empty when no comments exist", () => {
      const result = getCategoryDistribution(testDb);

      expect(result.classified).toHaveLength(0);
      expect(result.unclassifiedCount).toBe(0);
    });
  });

  // US-2.09: getCategoryDistributionByReviewer
  describe("getCategoryDistributionByReviewer", () => {
    beforeEach(() => {
      // Seed review comments from two reviewers within the period
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES
          (2001, 1, 'bob', 'Architecture concern', '2026-02-05T10:00:00Z', '2026-02-05T10:00:00Z'),
          (2002, 1, 'bob', 'Nitpick: spacing', '2026-02-06T10:00:00Z', '2026-02-06T10:00:00Z'),
          (2003, 1, 'carol', 'Security issue here', '2026-02-07T10:00:00Z', '2026-02-07T10:00:00Z'),
          (2004, 1, 'bob', 'Outside period', '2026-01-15T10:00:00Z', '2026-01-15T10:00:00Z');
      `);

      // Classify them
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES
          ('review_comment', 1, 'architecture_design', 90, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 2, 'nitpick_style', 80, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 3, 'security', 85, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 4, 'bug_correctness', 70, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);
    });

    it("returns category distribution grouped by reviewer within the period", () => {
      const results = getCategoryDistributionByReviewer(
        ["bob", "carol"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      // bob has 2 in-period review comments (architecture + nitpick), carol has 1 (security)
      // bob's out-of-period comment (id=4) should be excluded
      const bobArch = results.find(
        (r) => r.reviewer === "bob" && r.category === "architecture_design",
      );
      const bobNitpick = results.find(
        (r) => r.reviewer === "bob" && r.category === "nitpick_style",
      );
      const carolSecurity = results.find(
        (r) => r.reviewer === "carol" && r.category === "security",
      );

      expect(bobArch).toEqual({ reviewer: "bob", category: "architecture_design", count: 1 });
      expect(bobNitpick).toEqual({ reviewer: "bob", category: "nitpick_style", count: 1 });
      expect(carolSecurity).toEqual({ reviewer: "carol", category: "security", count: 1 });

      // No bug_correctness because that comment is outside the period
      const bobBug = results.find(
        (r) => r.reviewer === "bob" && r.category === "bug_correctness",
      );
      expect(bobBug).toBeUndefined();
    });

    it("filters by team usernames", () => {
      const results = getCategoryDistributionByReviewer(
        ["carol"], // only carol
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      expect(results).toHaveLength(1);
      expect(results[0].reviewer).toBe("carol");
    });

    it("returns empty array when no team usernames provided", () => {
      const results = getCategoryDistributionByReviewer(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(results).toHaveLength(0);
    });

    it("returns empty array when no classifications exist in the period", () => {
      const results = getCategoryDistributionByReviewer(
        ["bob"],
        "2025-01-01T00:00:00Z",
        "2025-02-01T00:00:00Z",
        testDb,
      );
      expect(results).toHaveLength(0);
    });

    it("includes pr_comments in the distribution", () => {
      // Add a pr_comment from bob within the period
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'This looks like a perf issue', '2026-02-10T10:00:00Z', '2026-02-10T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'performance', 75, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);

      const results = getCategoryDistributionByReviewer(
        ["bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      // bob should have: architecture_design(1), nitpick_style(1), performance(1)
      expect(results).toHaveLength(3);
      const bobPerf = results.find(
        (r) => r.reviewer === "bob" && r.category === "performance",
      );
      expect(bobPerf).toEqual({ reviewer: "bob", category: "performance", count: 1 });
    });

    it("merges counts from review_comments and pr_comments for same reviewer+category", () => {
      // Add a pr_comment from bob classified as architecture_design (same category as review_comment id=1)
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3002, 1, 'bob', 'Design concern too', '2026-02-08T10:00:00Z', '2026-02-08T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'architecture_design', 85, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);

      const results = getCategoryDistributionByReviewer(
        ["bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      const bobArch = results.find(
        (r) => r.reviewer === "bob" && r.category === "architecture_design",
      );
      // 1 from review_comments + 1 from pr_comments = 2
      expect(bobArch?.count).toBe(2);
    });
  });

  // US-2.08: getCategoryDistributionFiltered
  describe("getCategoryDistributionFiltered", () => {
    beforeEach(() => {
      // Seed review comments from two reviewers at different dates
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES
          (2001, 1, 'bob', 'Bug comment', '2026-02-05T10:00:00Z', '2026-02-05T10:00:00Z'),
          (2002, 1, 'carol', 'Style nit', '2026-02-10T10:00:00Z', '2026-02-10T10:00:00Z'),
          (2003, 1, 'bob', 'Perf issue', '2026-01-15T10:00:00Z', '2026-01-15T10:00:00Z');
      `);
      // Seed a pr_comment from bob
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'Architecture concern', '2026-02-06T10:00:00Z', '2026-02-06T10:00:00Z');
      `);
      // Classify them
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES
          ('review_comment', 1, 'bug_correctness', 90, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 2, 'nitpick_style', 80, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 3, 'performance', 70, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('pr_comment', 1, 'architecture_design', 85, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);
    });

    it("returns all categories when no filters are given", () => {
      const results = getCategoryDistributionFiltered({}, testDb);

      expect(results).toHaveLength(4);
      const total = results.reduce((s, r) => s + r.count, 0);
      expect(total).toBe(4);
    });

    it("filters by date range", () => {
      const results = getCategoryDistributionFiltered(
        { startDate: "2026-02-01T00:00:00Z", endDate: "2026-03-01T00:00:00Z" },
        testDb,
      );

      // Only 3 comments are in Feb (id 1, 2, and pr_comment 1); id 3 is Jan
      expect(results.reduce((s, r) => s + r.count, 0)).toBe(3);
    });

    it("filters by team usernames", () => {
      const results = getCategoryDistributionFiltered(
        { teamUsernames: ["carol"] },
        testDb,
      );

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("nitpick_style");
      expect(results[0].count).toBe(1);
    });

    it("combines date and team filters", () => {
      const results = getCategoryDistributionFiltered(
        {
          teamUsernames: ["bob"],
          startDate: "2026-02-01T00:00:00Z",
          endDate: "2026-03-01T00:00:00Z",
        },
        testDb,
      );

      // bob has 2 in-period: review_comment id=1 (bug) + pr_comment id=1 (architecture)
      expect(results.reduce((s, r) => s + r.count, 0)).toBe(2);
    });

    it("returns empty array when no classifications match", () => {
      const results = getCategoryDistributionFiltered(
        { startDate: "2025-01-01T00:00:00Z", endDate: "2025-02-01T00:00:00Z" },
        testDb,
      );

      expect(results).toHaveLength(0);
    });

    it("merges review_comments and pr_comments counts for same category", () => {
      // Add another review_comment from bob classified as architecture_design
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2004, 1, 'bob', 'Design concern', '2026-02-07T10:00:00Z', '2026-02-07T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 4, 'architecture_design', 75, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);

      const results = getCategoryDistributionFiltered(
        {
          teamUsernames: ["bob"],
          startDate: "2026-02-01T00:00:00Z",
          endDate: "2026-03-01T00:00:00Z",
        },
        testDb,
      );

      const arch = results.find((r) => r.category === "architecture_design");
      // 1 from review_comments + 1 from pr_comments = 2
      expect(arch?.count).toBe(2);
    });
  });

  // US-2.08: getCategoryTrendByWeek
  describe("getCategoryTrendByWeek", () => {
    beforeEach(() => {
      // Seed review comments in different weeks
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES
          (2001, 1, 'bob', 'Bug in week 5', '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z'),
          (2002, 1, 'bob', 'Another bug in week 5', '2026-02-03T10:00:00Z', '2026-02-03T10:00:00Z'),
          (2003, 1, 'bob', 'Nit in week 6', '2026-02-09T10:00:00Z', '2026-02-09T10:00:00Z'),
          (2004, 1, 'carol', 'Security in week 6', '2026-02-10T10:00:00Z', '2026-02-10T10:00:00Z');
      `);
      // Classify them
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES
          ('review_comment', 1, 'bug_correctness', 90, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 2, 'bug_correctness', 80, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 3, 'nitpick_style', 75, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 4, 'security', 85, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);
    });

    it("groups classifications by week and category", () => {
      const results = getCategoryTrendByWeek(
        ["bob", "carol"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      // Week 05: 2 bug_correctness; Week 06: 1 nitpick + 1 security
      expect(results.length).toBeGreaterThanOrEqual(3);

      const week05Bugs = results.find(
        (r) => r.week.includes("05") && r.category === "bug_correctness",
      );
      expect(week05Bugs?.count).toBe(2);

      const week06Nit = results.find(
        (r) => r.week.includes("06") && r.category === "nitpick_style",
      );
      expect(week06Nit?.count).toBe(1);
    });

    it("respects date range boundaries", () => {
      // Add a comment outside the period
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, created_at, updated_at)
        VALUES (2005, 1, 'bob', 'Jan comment', '2026-01-15T10:00:00Z', '2026-01-15T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 5, 'performance', 70, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);

      const results = getCategoryTrendByWeek(
        ["bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      // No performance category from Jan should appear
      const perf = results.find((r) => r.category === "performance");
      expect(perf).toBeUndefined();
    });

    it("includes pr_comments in weekly trend", () => {
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'Architecture concern', '2026-02-02T12:00:00Z', '2026-02-02T12:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'bug_correctness', 85, 'claude-haiku', 1, '2026-02-23T10:00:00Z');
      `);

      const results = getCategoryTrendByWeek(
        ["bob"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      // Week 05 should now have 3 bug_correctness (2 review + 1 pr)
      const week05Bugs = results.find(
        (r) => r.week.includes("05") && r.category === "bug_correctness",
      );
      expect(week05Bugs?.count).toBe(3);
    });

    it("returns empty array when no data matches", () => {
      const results = getCategoryTrendByWeek(
        ["bob"],
        "2025-01-01T00:00:00Z",
        "2025-02-01T00:00:00Z",
        testDb,
      );
      expect(results).toHaveLength(0);
    });

    it("returns empty array when no team usernames provided", () => {
      const results = getCategoryTrendByWeek(
        [],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );
      expect(results).toHaveLength(0);
    });

    it("returns weeks in chronological order", () => {
      const results = getCategoryTrendByWeek(
        ["bob", "carol"],
        "2026-02-01T00:00:00Z",
        "2026-03-01T00:00:00Z",
        testDb,
      );

      for (let i = 1; i < results.length; i++) {
        expect(results[i].week >= results[i - 1].week).toBe(true);
      }
    });
  });

  describe("getTopClassifiedCommentsByMember", () => {
    beforeEach(() => {
      // Seed team members
      testSqlite.exec(`
        INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
        VALUES ('bob', 'Bob', '#E25A3B', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
        VALUES ('carol', 'Carol', '#3B82F6', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
      `);

      // Seed review comments by bob
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2001, 1, 'bob', 'This has a null pointer bug', 'src/app.ts', 42, '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2002, 1, 'bob', 'SQL injection risk here', 'src/db.ts', 10, '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2003, 1, 'bob', 'Minor style nit', NULL, NULL, '2026-02-02T12:00:00Z', '2026-02-02T12:00:00Z');
      `);

      // Classify them
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 1, 'bug_correctness', 90, 'claude-haiku', 1, '2026-02-23T10:01:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 2, 'security', 85, 'claude-haiku', 1, '2026-02-23T10:02:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 3, 'nitpick_style', 75, 'claude-haiku', 1, '2026-02-23T10:03:00Z');
      `);
    });

    it("returns only high-value category comments with high confidence", () => {
      // bob is team member id 1
      const results = getTopClassifiedCommentsByMember(1, 70, testDb);

      // Should return bug_correctness (90) and security (85), NOT nitpick_style
      expect(results).toHaveLength(2);
      expect(results[0].category).toBe("bug_correctness");
      expect(results[0].confidence).toBe(90);
      expect(results[1].category).toBe("security");
      expect(results[1].confidence).toBe(85);
    });

    it("respects minimum confidence threshold", () => {
      const results = getTopClassifiedCommentsByMember(1, 88, testDb);

      // Only the 90-confidence bug_correctness should pass
      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(90);
    });

    it("returns empty array when no comments match", () => {
      // carol (id=2) has no review comments
      const results = getTopClassifiedCommentsByMember(2, 70, testDb);
      expect(results).toHaveLength(0);
    });

    it("does not return comments from other team members", () => {
      // Add a review comment by carol
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2004, 1, 'carol', 'Architecture concern', 'src/arch.ts', 1, '2026-02-02T13:00:00Z', '2026-02-02T13:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 4, 'architecture_design', 95, 'claude-haiku', 1, '2026-02-23T10:04:00Z');
      `);

      // bob's results should not include carol's comment
      const bobResults = getTopClassifiedCommentsByMember(1, 70, testDb);
      expect(bobResults).toHaveLength(2);
      expect(bobResults.every((r) => r.commentType === "review_comment")).toBe(
        true,
      );

      // carol's results should only include her comment
      const carolResults = getTopClassifiedCommentsByMember(2, 70, testDb);
      expect(carolResults).toHaveLength(1);
      expect(carolResults[0].category).toBe("architecture_design");
    });

    it("includes pr_comments in results", () => {
      // Add a pr_comment by bob
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'This architecture needs rethinking', '2026-02-02T14:00:00Z', '2026-02-02T14:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'architecture_design', 80, 'claude-haiku', 1, '2026-02-23T10:05:00Z');
      `);

      const results = getTopClassifiedCommentsByMember(1, 70, testDb);

      // Should have 2 review_comments + 1 pr_comment = 3
      expect(results).toHaveLength(3);
      const prComment = results.find((r) => r.commentType === "pr_comment");
      expect(prComment).toBeDefined();
      expect(prComment!.body).toBe("This architecture needs rethinking");
    });

    it("sorts by confidence descending", () => {
      const results = getTopClassifiedCommentsByMember(1, 70, testDb);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(
          results[i].confidence,
        );
      }
    });
  });

  // US-2.13: getLowDepthCommentsByMember tests
  describe("getLowDepthCommentsByMember", () => {
    beforeEach(() => {
      // Seed team members
      testSqlite.exec(`
        INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
        VALUES ('bob', 'Bob', '#E25A3B', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
        VALUES ('carol', 'Carol', '#3B82F6', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
      `);

      // Seed two PRs
      testSqlite.exec(`
        INSERT INTO pull_requests (github_id, number, title, author, state, created_at)
        VALUES (1002, 2, 'Fix login flow', 'dave', 'merged', '2026-02-01T10:00:00Z');
      `);

      // Bob's review comments: one nitpick, one question, one bug (high-value)
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES
          (2001, 1, 'bob', 'Nitpick: missing semicolon', 'src/app.ts', 10, '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z'),
          (2002, 1, 'bob', 'What does this do?', 'src/utils.ts', 20, '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z'),
          (2003, 1, 'bob', 'This has a null pointer bug', 'src/app.ts', 42, '2026-02-02T12:00:00Z', '2026-02-02T12:00:00Z');
      `);

      // Classify bob's comments
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES
          ('review_comment', 1, 'nitpick_style', 80, 'claude-haiku', 1, '2026-02-23T10:00:00Z'),
          ('review_comment', 2, 'question_clarification', 70, 'claude-haiku', 1, '2026-02-23T10:01:00Z'),
          ('review_comment', 3, 'bug_correctness', 90, 'claude-haiku', 1, '2026-02-23T10:02:00Z');
      `);
    });

    it("returns nitpick_style and question_clarification comments for the member", () => {
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.category)).toEqual(
        expect.arrayContaining(["nitpick_style", "question_clarification"]),
      );
    });

    it("excludes high-value categories (bug_correctness, security, architecture_design)", () => {
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      expect(results.every((r) => r.category !== "bug_correctness")).toBe(true);
      expect(results.every((r) => r.category !== "security")).toBe(true);
      expect(results.every((r) => r.category !== "architecture_design")).toBe(true);
    });

    it("respects minimum confidence threshold", () => {
      const results = getLowDepthCommentsByMember(1, 75, testDb);

      // Only the nitpick_style (80) passes, question_clarification (70) does not
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("nitpick_style");
      expect(results[0].confidence).toBe(80);
    });

    it("returns empty array when member does not exist", () => {
      const results = getLowDepthCommentsByMember(999, 50, testDb);
      expect(results).toHaveLength(0);
    });

    it("returns empty array when member has no low-depth comments", () => {
      // carol (id=2) has no comments at all
      const results = getLowDepthCommentsByMember(2, 50, testDb);
      expect(results).toHaveLength(0);
    });

    it("does not include comments from other members", () => {
      // Add a nitpick from carol on PR 1
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2004, 1, 'carol', 'Style: use camelCase', 'src/app.ts', 5, '2026-02-02T13:00:00Z', '2026-02-02T13:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 4, 'nitpick_style', 85, 'claude-haiku', 1, '2026-02-23T10:03:00Z');
      `);

      // bob's results should not include carol's comment
      const bobResults = getLowDepthCommentsByMember(1, 50, testDb);
      expect(bobResults).toHaveLength(2);
      expect(bobResults.every((r) => r.body !== "Style: use camelCase")).toBe(true);
    });

    it("sets prHadHighValueIssues=true when other reviewers found bugs/security on same PR", () => {
      // Carol found a security issue on PR 1 (same PR as bob's nitpick)
      testSqlite.exec(`
        INSERT INTO review_comments (github_id, pull_request_id, reviewer, body, file_path, line, created_at, updated_at)
        VALUES (2005, 1, 'carol', 'SQL injection risk!', 'src/db.ts', 30, '2026-02-02T14:00:00Z', '2026-02-02T14:00:00Z');
      `);
      // carol's review_comment gets auto-id 4 (after bob's 3 review_comments)
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('review_comment', 4, 'security', 95, 'claude-haiku', 1, '2026-02-23T10:04:00Z');
      `);

      const results = getLowDepthCommentsByMember(1, 50, testDb);

      // Bob's low-depth comments on PR 1 should have prHadHighValueIssues=true
      expect(results.every((r) => r.prHadHighValueIssues)).toBe(true);
    });

    it("sets prHadHighValueIssues=false when no other reviewer found serious issues", () => {
      // No other reviewer found bugs/security on PR 1 — only bob's own bug_correctness exists
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      // Bob's own bug_correctness comment doesn't count (same reviewer)
      expect(results.every((r) => !r.prHadHighValueIssues)).toBe(true);
    });

    it("excludes member's own high-value comments from prHadHighValueIssues check", () => {
      // Bob himself found a bug on PR 1 (already seeded as comment 3: bug_correctness)
      // This should NOT count — we only want OTHER reviewers' findings
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      expect(results.every((r) => !r.prHadHighValueIssues)).toBe(true);
    });

    it("includes pr_comments in results", () => {
      // Add a pr_comment by bob classified as nitpick
      testSqlite.exec(`
        INSERT INTO pr_comments (github_id, pull_request_id, author, body, created_at, updated_at)
        VALUES (3001, 1, 'bob', 'Minor formatting issue', '2026-02-02T15:00:00Z', '2026-02-02T15:00:00Z');
      `);
      testSqlite.exec(`
        INSERT INTO comment_classifications (comment_type, comment_id, category, confidence, model_used, classification_run_id, classified_at)
        VALUES ('pr_comment', 1, 'nitpick_style', 65, 'claude-haiku', 1, '2026-02-23T10:05:00Z');
      `);

      const results = getLowDepthCommentsByMember(1, 50, testDb);

      expect(results).toHaveLength(3);
      const prComment = results.find((r) => r.commentType === "pr_comment");
      expect(prComment).toBeDefined();
      expect(prComment!.body).toBe("Minor formatting issue");
      expect(prComment!.filePath).toBeNull();
    });

    it("includes prId in results for context", () => {
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => typeof r.prId === "number")).toBe(true);
    });

    it("sorts results by confidence descending", () => {
      const results = getLowDepthCommentsByMember(1, 50, testDb);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(
          results[i].confidence,
        );
      }
    });
  });
});
