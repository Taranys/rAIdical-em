// US-010: Sync runs data access layer
import { db as defaultDb } from "./index";
import { syncRuns } from "./schema";
import { eq, and, desc } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export function createSyncRun(
  repository: string,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(syncRuns)
    .values({
      repository,
      startedAt: new Date().toISOString(),
      status: "running",
      prCount: 0,
      commentCount: 0,
    })
    .returning()
    .get();
}

export function completeSyncRun(
  id: number,
  status: "success" | "error",
  prCount: number,
  errorMessage: string | null,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .update(syncRuns)
    .set({
      status,
      prCount,
      errorMessage,
      completedAt: new Date().toISOString(),
    })
    .where(eq(syncRuns.id, id))
    .returning()
    .get();
}

export function updateSyncRunProgress(
  id: number,
  prCount: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .update(syncRuns)
    .set({ prCount })
    .where(eq(syncRuns.id, id))
    .returning()
    .get();
}

export function getLatestSyncRun(
  repository: string,
  dbInstance: DbInstance = defaultDb,
) {
  return (
    dbInstance
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.repository, repository))
      .orderBy(desc(syncRuns.id))
      .limit(1)
      .get() ?? null
  );
}

export function getActiveSyncRun(
  repository: string,
  dbInstance: DbInstance = defaultDb,
) {
  return (
    dbInstance
      .select()
      .from(syncRuns)
      .where(
        and(eq(syncRuns.repository, repository), eq(syncRuns.status, "running")),
      )
      .get() ?? null
  );
}
