// US-2.05: Comment classifications data access layer
import { db as defaultDb } from "./index";
import {
  commentClassifications,
  reviewComments,
  prComments,
  pullRequests,
} from "./schema";
import { eq, sql, count } from "drizzle-orm";

type DbInstance = typeof defaultDb;

// --- Types ---

export interface CommentToClassify {
  commentType: "review_comment" | "pr_comment";
  commentId: number;
  body: string;
  filePath: string | null;
  prTitle: string;
}

export interface ClassificationInsert {
  commentType: "review_comment" | "pr_comment";
  commentId: number;
  category: string;
  confidence: number;
  modelUsed: string;
  classificationRunId: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

// --- Queries ---

// US-2.05: Find review_comments that have no classification yet
export function getUnclassifiedReviewComments(
  dbInstance: DbInstance = defaultDb,
): CommentToClassify[] {
  const results = dbInstance
    .select({
      commentId: reviewComments.id,
      body: reviewComments.body,
      filePath: reviewComments.filePath,
      prTitle: pullRequests.title,
    })
    .from(reviewComments)
    .innerJoin(pullRequests, eq(reviewComments.pullRequestId, pullRequests.id))
    .where(
      sql`${reviewComments.id} NOT IN (
        SELECT ${commentClassifications.commentId}
        FROM ${commentClassifications}
        WHERE ${commentClassifications.commentType} = 'review_comment'
      )`,
    )
    .all();

  return results.map((r) => ({
    commentType: "review_comment" as const,
    commentId: r.commentId,
    body: r.body,
    filePath: r.filePath,
    prTitle: r.prTitle,
  }));
}

// US-2.05: Find pr_comments that have no classification yet
export function getUnclassifiedPrComments(
  dbInstance: DbInstance = defaultDb,
): CommentToClassify[] {
  const results = dbInstance
    .select({
      commentId: prComments.id,
      body: prComments.body,
      prTitle: pullRequests.title,
    })
    .from(prComments)
    .innerJoin(pullRequests, eq(prComments.pullRequestId, pullRequests.id))
    .where(
      sql`${prComments.id} NOT IN (
        SELECT ${commentClassifications.commentId}
        FROM ${commentClassifications}
        WHERE ${commentClassifications.commentType} = 'pr_comment'
      )`,
    )
    .all();

  return results.map((r) => ({
    commentType: "pr_comment" as const,
    commentId: r.commentId,
    body: r.body,
    filePath: null,
    prTitle: r.prTitle,
  }));
}

// US-2.05: Insert a single classification result
export function insertClassification(
  data: ClassificationInsert,
  dbInstance: DbInstance = defaultDb,
) {
  return dbInstance
    .insert(commentClassifications)
    .values({
      commentType: data.commentType,
      commentId: data.commentId,
      category: data.category,
      confidence: data.confidence,
      modelUsed: data.modelUsed,
      classificationRunId: data.classificationRunId,
      classifiedAt: new Date().toISOString(),
    })
    .returning()
    .get();
}

// US-2.05: Get classification summary for a run (category counts + avg confidence)
export function getClassificationSummary(
  runId: number,
  dbInstance: DbInstance = defaultDb,
) {
  const categories = dbInstance
    .select({
      category: commentClassifications.category,
      count: count(),
    })
    .from(commentClassifications)
    .where(eq(commentClassifications.classificationRunId, runId))
    .groupBy(commentClassifications.category)
    .all();

  const avgResult = dbInstance
    .select({
      avgConfidence: sql<number>`AVG(${commentClassifications.confidence})`,
      total: count(),
    })
    .from(commentClassifications)
    .where(eq(commentClassifications.classificationRunId, runId))
    .get();

  return {
    categories,
    totalClassified: avgResult?.total ?? 0,
    averageConfidence: Math.round(avgResult?.avgConfidence ?? 0),
  };
}
