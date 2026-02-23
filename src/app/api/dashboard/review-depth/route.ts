// US-2.09: API route — review depth score per team member
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getCategoryDistributionByReviewer } from "@/db/comment-classifications";
import { computeDepthScore, type DepthScoreResult } from "@/lib/review-depth-score";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 },
    );
  }

  const members = getAllTeamMembers();
  const teamUsernames = members.map((m) => m.githubUsername);

  const distributions = getCategoryDistributionByReviewer(
    teamUsernames,
    startDate,
    endDate,
  );

  // Group distributions by reviewer
  const byReviewer = new Map<string, { category: string; count: number }[]>();
  for (const d of distributions) {
    const existing = byReviewer.get(d.reviewer) ?? [];
    existing.push({ category: d.category, count: d.count });
    byReviewer.set(d.reviewer, existing);
  }

  // Compute depth score for each reviewer
  const data: DepthScoreResult[] = Array.from(byReviewer.entries()).map(
    ([reviewer, categories]) => ({
      reviewer,
      score: computeDepthScore(categories),
      totalComments: categories.reduce((sum, c) => sum + c.count, 0),
      categoryBreakdown: categories,
    }),
  );

  return NextResponse.json({ data });
}
