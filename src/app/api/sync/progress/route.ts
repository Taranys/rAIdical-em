// US-025: Sync progress per team member
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getPRCountByAuthor } from "@/db/pull-requests";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceDate = searchParams.get("sinceDate");

  if (!sinceDate) {
    return NextResponse.json(
      { error: "sinceDate is required" },
      { status: 400 },
    );
  }

  const members = getAllTeamMembers();
  const teamUsernames = new Set(members.map((m) => m.githubUsername));
  const byAuthor = getPRCountByAuthor(sinceDate);

  const teamProgress: { author: string; count: number }[] = [];
  let nonTeamCount = 0;
  let totalCount = 0;

  for (const row of byAuthor) {
    totalCount += row.count;
    if (teamUsernames.has(row.author)) {
      teamProgress.push(row);
    } else {
      nonTeamCount += row.count;
    }
  }

  // Sort by count descending
  teamProgress.sort((a, b) => b.count - a.count);

  return NextResponse.json({ teamProgress, nonTeamCount, totalCount });
}
