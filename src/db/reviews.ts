// US-011: Reviews data access layer
import { db as defaultDb } from "./index";
import { reviews } from "./schema";
import { count } from "drizzle-orm";

type DbInstance = typeof defaultDb;

export interface ReviewInput {
  githubId: number;
  pullRequestId: number;
  reviewer: string;
  state: string;
  submittedAt: string;
}

export function upsertReview(
  input: ReviewInput,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(reviews)
    .values({
      githubId: input.githubId,
      pullRequestId: input.pullRequestId,
      reviewer: input.reviewer,
      state: input.state,
      submittedAt: input.submittedAt,
    })
    .onConflictDoUpdate({
      target: reviews.githubId,
      set: {
        pullRequestId: input.pullRequestId,
        reviewer: input.reviewer,
        state: input.state,
        submittedAt: input.submittedAt,
      },
    })
    .returning()
    .get();
}

export function getReviewCount(
  dbInstance: DbInstance = defaultDb,
): number {
  const result = dbInstance
    .select({ count: count() })
    .from(reviews)
    .get();

  return result?.count ?? 0;
}
