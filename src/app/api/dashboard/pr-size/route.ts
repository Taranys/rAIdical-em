// US-016: API route — median PR size per team member
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getMedianPRSizeByMember } from "@/db/pull-requests";

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

  const repositoryId = searchParams.get("repositoryId")
    ? parseInt(searchParams.get("repositoryId")!, 10)
    : undefined;

  const members = getAllTeamMembers();
  const teamUsernames = members.map((m) => m.githubUsername);

  const byMember = getMedianPRSizeByMember(teamUsernames, startDate, endDate, undefined, repositoryId);

  return NextResponse.json({ byMember });
}
