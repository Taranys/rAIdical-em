// US-2.11: API route for team members with their seniority profiles
import { NextResponse } from "next/server";
import { getAllTeamMembers } from "@/db/team-members";
import { getProfilesByTeamMember } from "@/db/seniority-profiles";
import { getActiveDimensionNames } from "@/lib/seniority-dimensions";
import { getEnabledDimensionConfigs } from "@/db/seniority-dimension-configs";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = getAllTeamMembers();
  const activeDimensionNames = getActiveDimensionNames();
  const dimensionConfigs = getEnabledDimensionConfigs();

  const membersWithProfiles = members.map((member) => {
    const profiles = getProfilesByTeamMember(member.id);
    return {
      id: member.id,
      githubUsername: member.githubUsername,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      color: member.color,
      profiles: profiles
        .filter((p) => activeDimensionNames.has(p.dimensionName))
        .map((p) => {
          let supportingMetrics: Record<string, unknown> | null = null;
          if (p.supportingMetrics) {
            try {
              supportingMetrics = JSON.parse(p.supportingMetrics);
            } catch {
              supportingMetrics = null;
            }
          }
          return {
            dimensionName: p.dimensionName,
            dimensionFamily: p.dimensionFamily,
            maturityLevel: p.maturityLevel,
            lastComputedAt: p.lastComputedAt,
            supportingMetrics,
          };
        }),
    };
  });

  return NextResponse.json({
    members: membersWithProfiles,
    dimensionConfigs: dimensionConfigs.map((d) => ({
      name: d.name,
      family: d.family,
      label: d.label,
      description: d.description,
      sortOrder: d.sortOrder,
    })),
  });
}
