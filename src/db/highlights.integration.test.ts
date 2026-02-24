// US-2.12: Highlights DAL integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  insertHighlight,
  getHighlightsByTeamMember,
  deleteAllHighlightsByType,
} from "./highlights";

describe("highlights DAL (integration)", () => {
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
      CREATE TABLE highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_type TEXT NOT NULL,
        comment_id INTEGER NOT NULL,
        highlight_type TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        team_member_id INTEGER NOT NULL REFERENCES team_members(id),
        created_at TEXT NOT NULL
      );
      CREATE INDEX idx_highlights_team_member ON highlights(team_member_id);
      CREATE INDEX idx_highlights_type ON highlights(highlight_type);
      CREATE INDEX idx_highlights_comment ON highlights(comment_type, comment_id);
    `);

    // Seed a team member
    testSqlite.exec(`
      INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
      VALUES ('alice', 'Alice', '#E25A3B', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
    `);
    testSqlite.exec(`
      INSERT INTO team_members (github_username, display_name, color, is_active, created_at, updated_at)
      VALUES ('bob', 'Bob', '#3B82F6', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  describe("insertHighlight", () => {
    it("inserts a highlight and returns the row", () => {
      const result = insertHighlight(
        {
          commentType: "review_comment",
          commentId: 10,
          highlightType: "best_comment",
          reasoning: "Excellent bug catch with clear fix suggestion",
          teamMemberId: 1,
        },
        testDb,
      );

      expect(result.id).toBe(1);
      expect(result.commentType).toBe("review_comment");
      expect(result.commentId).toBe(10);
      expect(result.highlightType).toBe("best_comment");
      expect(result.reasoning).toBe(
        "Excellent bug catch with clear fix suggestion",
      );
      expect(result.teamMemberId).toBe(1);
      expect(result.createdAt).toBeTruthy();
    });
  });

  describe("getHighlightsByTeamMember", () => {
    it("returns all highlights for a team member", () => {
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 10,
          highlightType: "best_comment",
          reasoning: "Great catch",
          teamMemberId: 1,
        },
        testDb,
      );
      insertHighlight(
        {
          commentType: "pr_comment",
          commentId: 20,
          highlightType: "growth_opportunity",
          reasoning: "Could be more specific",
          teamMemberId: 1,
        },
        testDb,
      );

      const results = getHighlightsByTeamMember(1, undefined, testDb);
      expect(results).toHaveLength(2);
    });

    it("filters by highlight type", () => {
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 10,
          highlightType: "best_comment",
          reasoning: "Great catch",
          teamMemberId: 1,
        },
        testDb,
      );
      insertHighlight(
        {
          commentType: "pr_comment",
          commentId: 20,
          highlightType: "growth_opportunity",
          reasoning: "Could be more specific",
          teamMemberId: 1,
        },
        testDb,
      );

      const bestOnly = getHighlightsByTeamMember(1, "best_comment", testDb);
      expect(bestOnly).toHaveLength(1);
      expect(bestOnly[0].highlightType).toBe("best_comment");
    });

    it("returns empty array when no highlights exist", () => {
      const results = getHighlightsByTeamMember(1, undefined, testDb);
      expect(results).toHaveLength(0);
    });

    it("does not return highlights from other team members", () => {
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 10,
          highlightType: "best_comment",
          reasoning: "Great catch",
          teamMemberId: 1,
        },
        testDb,
      );
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 11,
          highlightType: "best_comment",
          reasoning: "Nice find",
          teamMemberId: 2,
        },
        testDb,
      );

      const results = getHighlightsByTeamMember(1, undefined, testDb);
      expect(results).toHaveLength(1);
      expect(results[0].teamMemberId).toBe(1);
    });
  });

  describe("deleteAllHighlightsByType", () => {
    it("deletes all highlights of a given type", () => {
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 10,
          highlightType: "best_comment",
          reasoning: "Great",
          teamMemberId: 1,
        },
        testDb,
      );
      insertHighlight(
        {
          commentType: "review_comment",
          commentId: 11,
          highlightType: "best_comment",
          reasoning: "Nice",
          teamMemberId: 2,
        },
        testDb,
      );
      insertHighlight(
        {
          commentType: "pr_comment",
          commentId: 20,
          highlightType: "growth_opportunity",
          reasoning: "Improve this",
          teamMemberId: 1,
        },
        testDb,
      );

      deleteAllHighlightsByType("best_comment", testDb);

      // Only the growth_opportunity should remain
      const alice = getHighlightsByTeamMember(1, undefined, testDb);
      expect(alice).toHaveLength(1);
      expect(alice[0].highlightType).toBe("growth_opportunity");

      const bob = getHighlightsByTeamMember(2, undefined, testDb);
      expect(bob).toHaveLength(0);
    });
  });
});
