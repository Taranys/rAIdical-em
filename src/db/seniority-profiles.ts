// US-2.10: Seniority profiles data access layer
import { db as defaultDb } from "./index";
import { seniorityProfiles } from "./schema";
import { eq, and } from "drizzle-orm";

type DbInstance = typeof defaultDb;

// --- Types ---

export interface SeniorityProfileInsert {
  teamMemberId: number;
  dimensionName: string;
  dimensionFamily: "technical" | "soft_skill";
  maturityLevel: "junior" | "experienced" | "senior";
  supportingMetrics: Record<string, unknown>;
}

// --- Mutations ---

// US-2.10: Upsert a seniority profile (delete + insert for a given member+dimension)
export function upsertSeniorityProfile(
  data: SeniorityProfileInsert,
  dbInstance: DbInstance = defaultDb,
) {
  // Delete existing profile for this member+dimension, then insert
  dbInstance
    .delete(seniorityProfiles)
    .where(
      and(
        eq(seniorityProfiles.teamMemberId, data.teamMemberId),
        eq(seniorityProfiles.dimensionName, data.dimensionName),
      ),
    )
    .run();

  return dbInstance
    .insert(seniorityProfiles)
    .values({
      teamMemberId: data.teamMemberId,
      dimensionName: data.dimensionName,
      dimensionFamily: data.dimensionFamily,
      maturityLevel: data.maturityLevel,
      lastComputedAt: new Date().toISOString(),
      supportingMetrics: JSON.stringify(data.supportingMetrics),
    })
    .returning()
    .get();
}

// --- Queries ---

// US-2.10: Get all profiles for a team member
export function getProfilesByTeamMember(
  teamMemberId: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(seniorityProfiles)
    .where(eq(seniorityProfiles.teamMemberId, teamMemberId))
    .all();
}

// --- Deletions ---

// US-2.10: Delete all profiles (for full recomputation)
export function deleteAllProfiles(dbInstance: DbInstance = defaultDb) {
  return dbInstance.delete(seniorityProfiles).run();
}
