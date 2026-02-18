// US-012: PR comments data access layer
import { db as defaultDb } from "./index";
import { prComments } from "./schema";
import { count, eq } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface PrCommentInput {
  githubId: number;
  pullRequestId: number;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export function upsertPrComment(
  input: PrCommentInput,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(prComments)
    .values({
      githubId: input.githubId,
      pullRequestId: input.pullRequestId,
      author: input.author,
      body: input.body,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    })
    .onConflictDoUpdate({
      target: prComments.githubId,
      set: {
        pullRequestId: input.pullRequestId,
        author: input.author,
        body: input.body,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    })
    .returning()
    .get();
}

export function getPrCommentCount(
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: count() })
    .from(prComments)
    .get();

  return result?.count ?? 0;
}

export function getPrCommentsByPR(
  pullRequestId: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(prComments)
    .where(eq(prComments.pullRequestId, pullRequestId))
    .all();
}
