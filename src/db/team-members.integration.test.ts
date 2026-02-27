// US-007, US-008: Team members data access layer integration tests
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  getAllTeamMembers,
  getTeamMemberByUsername,
  createTeamMember,
  deactivateTeamMember,
  getActiveTeamMemberColors,
  getActiveTeamMemberUsernames,
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
        color TEXT NOT NULL DEFAULT '#E25A3B',
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
        color: "#E25A3B",
      },
      testDb,
    );

    expect(member.githubUsername).toBe("octocat");
    expect(member.displayName).toBe("The Octocat");
    expect(member.avatarUrl).toBe(
      "https://github.com/images/error/octocat_happy.gif",
    );
    expect(member.color).toBe("#E25A3B");
    expect(member.isActive).toBe(1);
    expect(member.createdAt).toBeTruthy();
    expect(member.updatedAt).toBeTruthy();
  });

  it("throws error when creating duplicate username", () => {
    createTeamMember(
      { githubUsername: "octocat", displayName: "First", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );

    expect(() =>
      createTeamMember(
        { githubUsername: "octocat", displayName: "Second", avatarUrl: null, color: "#2A9D8F" },
        testDb,
      ),
    ).toThrow();
  });

  it("retrieves all team members ordered by display name", () => {
    createTeamMember(
      { githubUsername: "user2", displayName: "Zoe", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "user1", displayName: "Alice", avatarUrl: null, color: "#2A9D8F" },
      testDb,
    );

    const members = getAllTeamMembers(testDb);
    expect(members).toHaveLength(2);
    expect(members[0].displayName).toBe("Alice");
    expect(members[1].displayName).toBe("Zoe");
  });

  it("only returns active members", () => {
    createTeamMember(
      { githubUsername: "active", displayName: "Active", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "inactive", displayName: "Inactive", avatarUrl: null, color: "#2A9D8F" },
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
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null, color: "#E25A3B" },
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
      { githubUsername: "user", displayName: "User", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    expect(member.avatarUrl).toBeNull();
  });

  // US-008: deactivateTeamMember tests
  it("deactivates a team member (soft delete)", () => {
    const member = createTeamMember(
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );

    const deactivated = deactivateTeamMember(member.id, testDb);

    expect(deactivated).not.toBeNull();
    expect(deactivated!.id).toBe(member.id);
    expect(deactivated!.githubUsername).toBe("octocat");
    expect(deactivated!.isActive).toBe(0);
  });

  it("returns null when deactivating non-existent member", () => {
    const result = deactivateTeamMember(999, testDb);
    expect(result).toBeNull();
  });

  it("returns null when deactivating already inactive member", () => {
    const member = createTeamMember(
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    deactivateTeamMember(member.id, testDb);

    const result = deactivateTeamMember(member.id, testDb);
    expect(result).toBeNull();
  });

  it("deactivated member is excluded from getAllTeamMembers", () => {
    const member = createTeamMember(
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    deactivateTeamMember(member.id, testDb);

    const members = getAllTeamMembers(testDb);
    expect(members).toHaveLength(0);
  });

  // Color-related tests
  it("stores and returns the assigned color", () => {
    const member = createTeamMember(
      { githubUsername: "octocat", displayName: "Octo", avatarUrl: null, color: "#3A86FF" },
      testDb,
    );
    expect(member.color).toBe("#3A86FF");
  });

  it("getActiveTeamMemberColors returns colors of active members only", () => {
    createTeamMember(
      { githubUsername: "alice", displayName: "Alice", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "bob", displayName: "Bob", avatarUrl: null, color: "#2A9D8F" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "charlie", displayName: "Charlie", avatarUrl: null, color: "#264653" },
      testDb,
    );
    // Deactivate charlie
    testSqlite.exec(
      "UPDATE team_members SET is_active = 0 WHERE github_username = 'charlie'",
    );

    const colors = getActiveTeamMemberColors(testDb);
    expect(colors).toHaveLength(2);
    expect(colors).toContain("#E25A3B");
    expect(colors).toContain("#2A9D8F");
    expect(colors).not.toContain("#264653");
  });

  it("getActiveTeamMemberColors returns empty array when no members", () => {
    expect(getActiveTeamMemberColors(testDb)).toEqual([]);
  });

  // getActiveTeamMemberUsernames tests
  it("getActiveTeamMemberUsernames returns set of active member usernames", () => {
    createTeamMember(
      { githubUsername: "alice", displayName: "Alice", avatarUrl: null, color: "#E25A3B" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "bob", displayName: "Bob", avatarUrl: null, color: "#2A9D8F" },
      testDb,
    );
    createTeamMember(
      { githubUsername: "charlie", displayName: "Charlie", avatarUrl: null, color: "#264653" },
      testDb,
    );
    // Deactivate charlie
    testSqlite.exec(
      "UPDATE team_members SET is_active = 0 WHERE github_username = 'charlie'",
    );

    const usernames = getActiveTeamMemberUsernames(testDb);
    expect(usernames).toBeInstanceOf(Set);
    expect(usernames.size).toBe(2);
    expect(usernames.has("alice")).toBe(true);
    expect(usernames.has("bob")).toBe(true);
    expect(usernames.has("charlie")).toBe(false);
  });

  it("getActiveTeamMemberUsernames returns empty set when no members", () => {
    const usernames = getActiveTeamMemberUsernames(testDb);
    expect(usernames).toBeInstanceOf(Set);
    expect(usernames.size).toBe(0);
  });
});
