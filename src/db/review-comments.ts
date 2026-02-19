// US-012, US-018: Review comments data access layer
import { db as defaultDb } from "./index";
import { reviewComments } from "./schema";
import { count, eq, and, gte, lt, inArray, sql } from "drizzle-orm";

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

// US-018: Average comments per review per team member
export function getAvgCommentsPerReviewByMember(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
) {
  if (teamUsernames.length === 0) return [];

  return dbInstance
    .select({
      reviewer: reviewComments.reviewer,
      totalComments: count(),
      prsReviewed: sql<number>`COUNT(DISTINCT ${reviewComments.pullRequestId})`,
      avg: sql<number>`CAST(COUNT(*) AS REAL) / COUNT(DISTINCT ${reviewComments.pullRequestId})`,
    })
    .from(reviewComments)
    .where(
      and(
        inArray(reviewComments.reviewer, teamUsernames),
        gte(reviewComments.createdAt, startDate),
        lt(reviewComments.createdAt, endDate),
      ),
    )
    .groupBy(reviewComments.reviewer)
    .all();
}
