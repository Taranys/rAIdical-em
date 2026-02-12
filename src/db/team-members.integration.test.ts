// US-007: Team members data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getAllTeamMembers,
  getTeamMemberByUsername,
  createTeamMember,
} from "./team-members";

describe("team-members DAL (integration)", () => {
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
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  });

  afterEach(() => {
    testSqlite.close();
  });

  it("returns empty array when no members exist", () => {
    expect(getAllTeamMembers(testDb)).toEqual([]);
  });

  it("creates a team member with all required fields", () => {
    const member = createTeamMember(
      {
        githubUsername: "octocat",
        displayName: "The Octocat",
        avatarUrl: "https://github.com/images/error/octocat_happy.gif",
      },
      testDb,
    );

    expect(member.githubUsername).toBe("octocat");
    expect(member.displayName).toBe("The Octocat");
    expect(member.avatarUrl).toBe(
      "https://github.com/images/error/octocat_happy.gif",
    );
    expect(member.isActive).toBe(1);
    expect(member.createdAt).toBeTruthy();
    expect(member.updatedAt).toBeTruthy();
  });

  it("throws error when creating duplicate username", () => {
    createTeamMember(
      { githubUsername: "octocat", displayName: "First", avatarUrl: null },
      testDb,
    );

    expect(() =>
      createTeamMember(
        { githubUsername: "octocat", displayName: "Second", avatarUrl: null },
        testDb,
      ),
    ).toThrow();
  });

  it("retrieves all team members ordered by display name", () => {
    createTeamMember(
      { githubUsername: "user2", displayName: "Zoe", avatarUrl: null },
      testDb,
    );
    createTeamMember(
      { githubUsername: "user1", displayName: "Alice", avatarUrl: null },
      testDb,
    );

    const members = getAllTeamMembers(testDb);
    expect(members).toHaveLength(2);
    expect(members[0].displayName).toBe("Alice");
    expect(members[1].displayName).toBe("Zoe");
  });

  it("only returns active members", () => {
    createTeamMember(
      { githubUsername: "active", displayName: "Active", avatarUrl: null },
      testDb,
    );
    createTeamMember(
      { githubUsername: "inactive", displayName: "Inactive", avatarUrl: null },
      testDb,
    );
    testSqlite.exec(
      "UPDATE team_members SET is_active = 0 WHERE github_username = 'inactive'",
    );

    const members = getAllTeamMembers(testDb);
    expect(members).toHaveLength(1);
    expect(members[0].githubUsername).toBe("active");
  });

  it("retrieves a member by username", () => {
    createTeamMember(
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null },
      testDb,
    );

    const member = getTeamMemberByUsername("octocat", testDb);
    expect(member).toBeTruthy();
    expect(member!.githubUsername).toBe("octocat");
  });

  it("returns null when member not found by username", () => {
    expect(getTeamMemberByUsername("nonexistent", testDb)).toBeNull();
  });

  it("handles null avatar URL", () => {
    const member = createTeamMember(
      { githubUsername: "user", displayName: "User", avatarUrl: null },
      testDb,
    );
    expect(member.avatarUrl).toBeNull();
  });
});
