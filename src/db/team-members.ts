// US-007, US-008: Team members data access layer
import { db as defaultDb } from "./index";
import { teamMembers } from "./schema";
import { eq, asc, and } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface TeamMemberInput {
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
}

export function getAllTeamMembers(dbInstance: DbInstance = defaultDb) {
  return dbInstance
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, 1))
    .orderBy(asc(teamMembers.displayName))
    .all();
}

export function getTeamMemberByUsername(
  username: string,
  dbInstance: DbInstance = defaultDb,
) {
  return (
    dbInstance
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.githubUsername, username))
      .get() ?? null
  );
}

export function createTeamMember(
  input: TeamMemberInput,
  dbInstance: DbInstance = defaultDb,
) {
  const now = new Date().toISOString();

  return dbInstance
    .insert(teamMembers)
    .values({
      githubUsername: input.githubUsername,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      color: input.color,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
}

export function getActiveTeamMemberColors(
  dbInstance: DbInstance = defaultDb,
): string[] {
  return dbInstance
    .select({ color: teamMembers.color })
    .from(teamMembers)
    .where(eq(teamMembers.isActive, 1))
    .all()
    .map((row) => row.color);
}

export function getActiveTeamMemberUsernames(
  dbInstance: DbInstance = defaultDb,
): Set<string> {
  const rows = dbInstance
    .select({ githubUsername: teamMembers.githubUsername })
    .from(teamMembers)
    .where(eq(teamMembers.isActive, 1))
    .all();
  return new Set(rows.map((row) => row.githubUsername));
}

// US-008: Soft-delete a team member (set isActive = 0)
export function deactivateTeamMember(
  id: number,
  dbInstance: DbInstance = defaultDb,
) {
  const now = new Date().toISOString();

  return (
    dbInstance
      .update(teamMembers)
      .set({ isActive: 0, updatedAt: now })
      .where(and(eq(teamMembers.id, id), eq(teamMembers.isActive, 1)))
      .returning()
      .get() ?? null
  );
}
