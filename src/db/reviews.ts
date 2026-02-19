// US-011, US-017: Reviews data access layer
import { db as defaultDb } from "./index";
import { reviews } from "./schema";
import { count, and, gte, lt, inArray, sql } from "drizzle-orm";

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

// US-017: Count of distinct PRs reviewed per team member within a date range
export function getPRsReviewedByMember(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): { reviewer: string; count: number }[] {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      reviewer: reviews.reviewer,
      count: sql<number>`COUNT(DISTINCT ${reviews.pullRequestId})`.as("count"),
    })
    .from(reviews)
    .where(
      and(
        inArray(reviews.reviewer, teamUsernames),
        gte(reviews.submittedAt, startDate),
        lt(reviews.submittedAt, endDate),
      ),
    )
    .groupBy(reviews.reviewer)
    .orderBy(sql`COUNT(DISTINCT ${reviews.pullRequestId}) DESC`)
    .all();
}
