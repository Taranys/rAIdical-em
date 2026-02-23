// US-2.05: Classification runs data access layer
import { db as defaultDb } from "./index";
import { classificationRuns } from "./schema";
import { eq, desc } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export function createClassificationRun(
  modelUsed: string,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(classificationRuns)
    .values({
      startedAt: new Date().toISOString(),
      status: "running",
      commentsProcessed: 0,
      errors: 0,
      modelUsed,
    })
    .returning()
    .get();
}

export function updateClassificationRunProgress(
  id: number,
  commentsProcessed: number,
  errors: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .update(classificationRuns)
    .set({ commentsProcessed, errors })
    .where(eq(classificationRuns.id, id))
    .returning()
    .get();
}

export function completeClassificationRun(
  id: number,
  status: "success" | "error",
  commentsProcessed: number,
  errors: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .update(classificationRuns)
    .set({
      status,
      commentsProcessed,
      errors,
      completedAt: new Date().toISOString(),
    })
    .where(eq(classificationRuns.id, id))
    .returning()
    .get();
}

export function getActiveClassificationRun(
  dbInstance: DbInstance = defaultDb,
) {
  return (
    dbInstance
      .select()
      .from(classificationRuns)
      .where(eq(classificationRuns.status, "running"))
      .get() ?? null
  );
}

export function getLatestClassificationRun(
  dbInstance: DbInstance = defaultDb,
) {
  return (
    dbInstance
      .select()
      .from(classificationRuns)
      .orderBy(desc(classificationRuns.id))
      .limit(1)
      .get() ?? null
  );
}

export function getClassificationRunHistory(
  limit: number = 10,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(classificationRuns)
    .orderBy(desc(classificationRuns.id))
    .limit(limit)
    .all();
}
