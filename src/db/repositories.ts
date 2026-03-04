// Multi-repo support: repositories data access layer
import { db as defaultDb, sqlite as defaultSqlite } from "./index";
import { repositories } from "./schema";
import { eq, asc } from "drizzle-orm";
import type Database from "better-sqlite3";

type DbInstance = typeof defaultDb;

export interface RepositoryInput {
  owner: string;
  name: string;
}

export function createRepository(
  input: RepositoryInput,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(repositories)
    .values({
      owner: input.owner,
      name: input.name,
      addedAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

export function listRepositories(dbInstance: DbInstance = defaultDb) {
  return dbInstance
    .select()
    .from(repositories)
    .orderBy(asc(repositories.addedAt))
    .all();
}

export function findRepositoryById(
  id: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .get();
}

export function findRepositoryByOwnerName(
  owner: string,
  name: string,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(repositories)
    .where(eq(repositories.owner, owner))
    .all()
    .find((r) => r.name === name);
}

export function deleteRepositoryWithCascade(
  id: number,
  sqliteInstance: InstanceType<typeof Database> = defaultSqlite as InstanceType<typeof Database>,
) {
  // Use raw SQL for cascade delete in a transaction to ensure atomicity.
  // Drizzle ORM doesn't support multi-table deletes in a single transaction easily.
  const deleteTransaction = sqliteInstance.transaction(() => {
    // Delete comments linked to PRs of this repo
    sqliteInstance.prepare("DELETE FROM review_comments WHERE repository_id = ?").run(id);
    sqliteInstance.prepare("DELETE FROM pr_comments WHERE repository_id = ?").run(id);
    // Delete reviews linked to PRs of this repo
    sqliteInstance.prepare("DELETE FROM reviews WHERE repository_id = ?").run(id);
    // Delete PRs of this repo
    sqliteInstance.prepare("DELETE FROM pull_requests WHERE repository_id = ?").run(id);
    // Delete sync runs of this repo
    sqliteInstance.prepare("DELETE FROM sync_runs WHERE repository_id = ?").run(id);
    // Delete the repository itself
    const result = sqliteInstance.prepare("DELETE FROM repositories WHERE id = ?").run(id);
    return result.changes > 0;
  });

  return deleteTransaction();
}
