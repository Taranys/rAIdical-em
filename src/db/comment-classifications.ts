// US-2.05: Comment classifications data access layer
import { db as defaultDb } from "./index";
import {
  commentClassifications,
  reviewComments,
  prComments,
  pullRequests,
  teamMembers,
} from "./schema";
import { and, eq, gte, inArray, lt, desc, sql, count } from "drizzle-orm";

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

export interface ReviewerCategoryDistribution {
  reviewer: string;
  category: string;
  count: number;
}

// US-2.12: Classified comment ready for highlight evaluation
export interface ClassifiedCommentForHighlight {
  commentType: "review_comment" | "pr_comment";
  commentId: number;
  category: string;
  confidence: number;
  body: string;
  filePath: string | null;
  prTitle: string;
}

// US-2.12: High-value categories for best comment detection
export const HIGH_VALUE_CATEGORIES = [
  "bug_correctness",
  "security",
  "architecture_design",
] as const;

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

// US-2.09: Get category distribution per reviewer for a given period
export function getCategoryDistributionByReviewer(
  teamUsernames: string[],
  startDate: string,
  endDate: string,
  dbInstance: DbInstance = defaultDb,
): ReviewerCategoryDistribution[] {
  if (teamUsernames.length === 0) return [];

  // Review comments (inline code comments)
  const reviewResults = dbInstance
    .select({
      reviewer: reviewComments.reviewer,
      category: commentClassifications.category,
      count: count(),
    })
    .from(commentClassifications)
    .innerJoin(
      reviewComments,
      and(
        eq(commentClassifications.commentType, sql`'review_comment'`),
        eq(commentClassifications.commentId, reviewComments.id),
      ),
    )
    .where(
      and(
        inArray(reviewComments.reviewer, teamUsernames),
        gte(reviewComments.createdAt, startDate),
        lt(reviewComments.createdAt, endDate),
      ),
    )
    .groupBy(reviewComments.reviewer, commentClassifications.category)
    .all();

  // PR comments (general issue-style comments)
  const prResults = dbInstance
    .select({
      reviewer: prComments.author,
      category: commentClassifications.category,
      count: count(),
    })
    .from(commentClassifications)
    .innerJoin(
      prComments,
      and(
        eq(commentClassifications.commentType, sql`'pr_comment'`),
        eq(commentClassifications.commentId, prComments.id),
      ),
    )
    .where(
      and(
        inArray(prComments.author, teamUsernames),
        gte(prComments.createdAt, startDate),
        lt(prComments.createdAt, endDate),
      ),
    )
    .groupBy(prComments.author, commentClassifications.category)
    .all();

  // Merge both result sets
  const merged = new Map<string, ReviewerCategoryDistribution>();
  for (const r of [...reviewResults, ...prResults]) {
    const key = `${r.reviewer}:${r.category}`;
    const existing = merged.get(key);
    if (existing) {
      existing.count += r.count;
    } else {
      merged.set(key, { reviewer: r.reviewer, category: r.category, count: r.count });
    }
  }

  return Array.from(merged.values());
}

// US-2.12: Get top classified comments for a team member (high-value categories, high confidence)
export function getTopClassifiedCommentsByMember(
  teamMemberId: number,
  minConfidence: number = 70,
  dbInstance: DbInstance = defaultDb,
): ClassifiedCommentForHighlight[] {
  // Query review_comments
  const reviewResults = dbInstance
    .select({
      commentId: commentClassifications.commentId,
      category: commentClassifications.category,
      confidence: commentClassifications.confidence,
      body: reviewComments.body,
      filePath: reviewComments.filePath,
      prTitle: pullRequests.title,
    })
    .from(commentClassifications)
    .innerJoin(
      reviewComments,
      eq(commentClassifications.commentId, reviewComments.id),
    )
    .innerJoin(pullRequests, eq(reviewComments.pullRequestId, pullRequests.id))
    .innerJoin(
      teamMembers,
      eq(reviewComments.reviewer, teamMembers.githubUsername),
    )
    .where(
      and(
        eq(commentClassifications.commentType, "review_comment"),
        eq(teamMembers.id, teamMemberId),
        sql`${commentClassifications.category} IN ('bug_correctness', 'security', 'architecture_design')`,
        sql`${commentClassifications.confidence} >= ${minConfidence}`,
      ),
    )
    .orderBy(desc(commentClassifications.confidence))
    .limit(20)
    .all();

  // Query pr_comments
  const prResults = dbInstance
    .select({
      commentId: commentClassifications.commentId,
      category: commentClassifications.category,
      confidence: commentClassifications.confidence,
      body: prComments.body,
      prTitle: pullRequests.title,
    })
    .from(commentClassifications)
    .innerJoin(prComments, eq(commentClassifications.commentId, prComments.id))
    .innerJoin(pullRequests, eq(prComments.pullRequestId, pullRequests.id))
    .innerJoin(teamMembers, eq(prComments.author, teamMembers.githubUsername))
    .where(
      and(
        eq(commentClassifications.commentType, "pr_comment"),
        eq(teamMembers.id, teamMemberId),
        sql`${commentClassifications.category} IN ('bug_correctness', 'security', 'architecture_design')`,
        sql`${commentClassifications.confidence} >= ${minConfidence}`,
      ),
    )
    .orderBy(desc(commentClassifications.confidence))
    .limit(20)
    .all();

  const combined: ClassifiedCommentForHighlight[] = [
    ...reviewResults.map((r) => ({
      commentType: "review_comment" as const,
      commentId: r.commentId,
      category: r.category,
      confidence: r.confidence,
      body: r.body,
      filePath: r.filePath,
      prTitle: r.prTitle,
    })),
    ...prResults.map((r) => ({
      commentType: "pr_comment" as const,
      commentId: r.commentId,
      category: r.category,
      confidence: r.confidence,
      body: r.body,
      filePath: null,
      prTitle: r.prTitle,
    })),
  ];

  // Sort by confidence DESC and cap at 20 total
  return combined.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}
