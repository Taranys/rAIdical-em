// US-2.08: API route for category distribution charts data
import { NextResponse } from "next/server";
import {
  getCategoryDistributionFiltered,
  getCategoryDistributionByReviewer,
  getCategoryTrendByWeek,
} from "@/db/comment-classifications";
import { getAllTeamMembers } from "@/db/team-members";

export const dynamic = "force-dynamic";

const DEFAULT_START = "1970-01-01T00:00:00Z";
const DEFAULT_END = "2099-12-31T23:59:59Z";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStart = searchParams.get("dateStart") || undefined;
  const dateEnd = searchParams.get("dateEnd") || undefined;
  const reviewer = searchParams.get("reviewer") || undefined;

  const members = getAllTeamMembers();
  const teamUsernames =
    reviewer && reviewer !== "all"
      ? [reviewer]
      : members.map((m) => m.githubUsername);

  // Chart 1: Team-wide category distribution
  const teamDistribution = getCategoryDistributionFiltered({
    teamUsernames,
    startDate: dateStart,
    endDate: dateEnd,
  });

  // Chart 2: Per-person stacked bar
  const perReviewer = getCategoryDistributionByReviewer(
    teamUsernames,
    dateStart ?? DEFAULT_START,
    dateEnd ?? DEFAULT_END,
  );

  // Chart 3: Weekly trend
  const weeklyTrend = getCategoryTrendByWeek(
    teamUsernames,
    dateStart ?? DEFAULT_START,
    dateEnd ?? DEFAULT_END,
  );

  return NextResponse.json({
    teamDistribution,
    perReviewer,
    weeklyTrend,
  });
}
