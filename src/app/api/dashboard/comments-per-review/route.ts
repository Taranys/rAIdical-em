// US-018: API route — average comments per review per team member
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getAvgCommentsPerReviewByMember } from "@/db/review-comments";

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

  const data = getAvgCommentsPerReviewByMember(
    teamUsernames,
    startDate,
    endDate,
  );

  return NextResponse.json({ data });
}
