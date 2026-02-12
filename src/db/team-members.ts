// US-007: Team members data access layer
import { db as defaultDb } from "./index";
import { teamMembers } from "./schema";
import { eq, asc } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface TeamMemberInput {
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
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
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
}
