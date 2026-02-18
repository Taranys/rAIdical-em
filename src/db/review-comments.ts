// US-012: Review comments data access layer
import { db as defaultDb } from "./index";
import { reviewComments } from "./schema";
import { count, eq } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface ReviewCommentInput {
  githubId: number;
  pullRequestId: number;
  reviewer: string;
  body: string;
  filePath: string | null;
  line: number | null;
  createdAt: string;
  updatedAt: string;
}

export function upsertReviewComment(
  input: ReviewCommentInput,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(reviewComments)
    .values({
      githubId: input.githubId,
      pullRequestId: input.pullRequestId,
      reviewer: input.reviewer,
      body: input.body,
      filePath: input.filePath,
      line: input.line,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    })
    .onConflictDoUpdate({
      target: reviewComments.githubId,
      set: {
        pullRequestId: input.pullRequestId,
        reviewer: input.reviewer,
        body: input.body,
        filePath: input.filePath,
        line: input.line,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    })
    .returning()
    .get();
}

export function getReviewCommentCount(
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: count() })
    .from(reviewComments)
    .get();

  return result?.count ?? 0;
}

export function getReviewCommentsByPR(
  pullRequestId: number,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.pullRequestId, pullRequestId))
    .all();
}
