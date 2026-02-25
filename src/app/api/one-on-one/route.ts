// US-2.14: API route — 1:1 preparation data for a team member
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getProfilesByTeamMember } from "@/db/seniority-profiles";
import { getHighlightsByTeamMember } from "@/db/highlights";
import {
  getCategoryDistributionByReviewer,
} from "@/db/comment-classifications";
import { computeDepthScore } from "@/lib/review-depth-score";
import {
  reviewComments,
  prComments,
  pullRequests,
} from "@/db/schema";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Resolve the comment body and PR title for a highlight
function resolveHighlightComment(
  highlight: {
    commentType: string;
    commentId: number;
    highlightType: string;
    reasoning: string;
  },
) {
  if (highlight.commentType === "review_comment") {
    const result = db
      .select({
        body: reviewComments.body,
        prTitle: pullRequests.title,
        prNumber: pullRequests.number,
      })
      .from(reviewComments)
      .innerJoin(pullRequests, eq(reviewComments.pullRequestId, pullRequests.id))
      .where(eq(reviewComments.id, highlight.commentId))
      .get();
    return result ?? null;
  }
  if (highlight.commentType === "pr_comment") {
    const result = db
      .select({
        body: prComments.body,
        prTitle: pullRequests.title,
        prNumber: pullRequests.number,
      })
      .from(prComments)
      .innerJoin(pullRequests, eq(prComments.pullRequestId, pullRequests.id))
      .where(eq(prComments.id, highlight.commentId))
      .get();
    return result ?? null;
  }
  return null;
}

// Get weekly review activity counts for a reviewer
function getWeeklyReviewActivity(
  githubUsername: string,
  startDate: string,
  endDate: string,
) {
  const rcResults = db
    .select({
      week: sql<string>`strftime('%Y-W%W', ${reviewComments.createdAt})`.as("week"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(reviewComments)
    .where(
      and(
        eq(reviewComments.reviewer, githubUsername),
        sql`${reviewComments.createdAt} >= ${startDate}`,
        sql`${reviewComments.createdAt} < ${endDate}`,
      ),
    )
    .groupBy(sql`strftime('%Y-W%W', ${reviewComments.createdAt})`)
    .all();

  const pcResults = db
    .select({
      week: sql<string>`strftime('%Y-W%W', ${prComments.createdAt})`.as("week"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(prComments)
    .where(
      and(
        eq(prComments.author, githubUsername),
        sql`${prComments.createdAt} >= ${startDate}`,
        sql`${prComments.createdAt} < ${endDate}`,
      ),
    )
    .groupBy(sql`strftime('%Y-W%W', ${prComments.createdAt})`)
    .all();

  // Merge by week
  const merged = new Map<string, number>();
  for (const r of [...rcResults, ...pcResults]) {
    merged.set(r.week, (merged.get(r.week) ?? 0) + r.count);
  }

  return Array.from(merged.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // If no memberId, return the list of team members
  if (!memberId) {
    const members = getAllTeamMembers();
    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        githubUsername: m.githubUsername,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        color: m.color,
      })),
    });
  }

  const id = parseInt(memberId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
  }

  // Find the member
  const members = getAllTeamMembers();
  const member = members.find((m) => m.id === id);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Seniority profiles
  const profiles = getProfilesByTeamMember(member.id);

  // Highlights (best comments + growth opportunities)
  const bestComments = getHighlightsByTeamMember(member.id, "best_comment");
  const growthOpportunities = getHighlightsByTeamMember(member.id, "growth_opportunity");

  // Enrich highlights with comment body and PR info
  const enrichedBestComments = bestComments.slice(0, 5).map((h) => {
    const comment = resolveHighlightComment(h);
    return {
      id: h.id,
      reasoning: h.reasoning,
      body: comment?.body ?? null,
      prTitle: comment?.prTitle ?? null,
      prNumber: comment?.prNumber ?? null,
    };
  });

  const enrichedGrowthOpportunities = growthOpportunities.slice(0, 5).map((h) => {
    const comment = resolveHighlightComment(h);
    return {
      id: h.id,
      reasoning: h.reasoning,
      body: comment?.body ?? null,
      prTitle: comment?.prTitle ?? null,
      prNumber: comment?.prNumber ?? null,
    };
  });

  // Review depth score
  let depthScore = 0;
  let totalComments = 0;
  let categoryBreakdown: { category: string; count: number }[] = [];

  if (startDate && endDate) {
    const distributions = getCategoryDistributionByReviewer(
      [member.githubUsername],
      startDate,
      endDate,
    );
    categoryBreakdown = distributions.map((d) => ({
      category: d.category,
      count: d.count,
    }));
    totalComments = categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
    depthScore = computeDepthScore(categoryBreakdown);
  }

  // Weekly review activity (for sparkline)
  let weeklyActivity: { week: string; count: number }[] = [];
  if (startDate && endDate) {
    weeklyActivity = getWeeklyReviewActivity(
      member.githubUsername,
      startDate,
      endDate,
    );
  }

  // Overall maturity level (most common level across profiles)
  const maturityCounts = { junior: 0, experienced: 0, senior: 0 };
  for (const p of profiles) {
    const level = p.maturityLevel as keyof typeof maturityCounts;
    if (level in maturityCounts) maturityCounts[level]++;
  }
  const overallMaturity =
    profiles.length > 0
      ? (Object.entries(maturityCounts).sort((a, b) => b[1] - a[1])[0][0] as string)
      : null;

  // Top dimensions (highest maturity)
  const maturityOrder = { senior: 3, experienced: 2, junior: 1 };
  const topDimensions = [...profiles]
    .sort(
      (a, b) =>
        (maturityOrder[b.maturityLevel as keyof typeof maturityOrder] ?? 0) -
        (maturityOrder[a.maturityLevel as keyof typeof maturityOrder] ?? 0),
    )
    .slice(0, 3)
    .map((p) => ({
      name: p.dimensionName,
      family: p.dimensionFamily,
      level: p.maturityLevel,
    }));

  // Top categories by count
  const topCategories = [...categoryBreakdown]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return NextResponse.json({
    member: {
      id: member.id,
      githubUsername: member.githubUsername,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      color: member.color,
    },
    summary: {
      overallMaturity,
      depthScore,
      totalComments,
      topDimensions,
      topCategories,
    },
    profiles: profiles.map((p) => ({
      dimensionName: p.dimensionName,
      dimensionFamily: p.dimensionFamily,
      maturityLevel: p.maturityLevel,
    })),
    bestComments: enrichedBestComments,
    growthOpportunities: enrichedGrowthOpportunities,
    weeklyActivity,
  });
}
