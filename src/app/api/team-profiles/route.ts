// US-2.11: API route for team members with their seniority profiles
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getProfilesByTeamMember } from "@/db/seniority-profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = getAllTeamMembers();

  const membersWithProfiles = members.map((member) => {
    const profiles = getProfilesByTeamMember(member.id);
    return {
      id: member.id,
      githubUsername: member.githubUsername,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      color: member.color,
      profiles: profiles.map((p) => ({
        dimensionName: p.dimensionName,
        dimensionFamily: p.dimensionFamily,
        maturityLevel: p.maturityLevel,
        lastComputedAt: p.lastComputedAt,
      })),
    };
  });

  return NextResponse.json({ members: membersWithProfiles });
}
