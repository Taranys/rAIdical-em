// US-010: Sync runs data access layer
import { db as defaultDb } from "./index";
import { syncRuns } from "./schema";
import { eq, desc } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export function createSyncRun(
  repository: string,
  dbInstance: DbInstance = defaultDb,
) {
  const now = new Date().toISOString();
  return dbInstance
    .insert(syncRuns)
    .values({
      repository,
      startedAt: now,
      status: "running",
      prCount: 0,
      commentCount: 0,
    })
    .returning()
    .get();
}

export function completeSyncRun(
  id: number,
  prCount: number,
  dbInstance: DbInstance = defaultDb,
): void {
  const now = new Date().toISOString();
  dbInstance
    .update(syncRuns)
    .set({
      status: "success",
      completedAt: now,
      prCount,
    })
    .where(eq(syncRuns.id, id))
    .run();
}

export function failSyncRun(
  id: number,
  errorMessage: string,
  dbInstance: DbInstance = defaultDb,
): void {
  const now = new Date().toISOString();
  dbInstance
    .update(syncRuns)
    .set({
      status: "error",
      completedAt: now,
      errorMessage,
    })
    .where(eq(syncRuns.id, id))
    .run();
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
