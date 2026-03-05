import { NextResponse } from "next/server";
import { hasSetting, getSetting } from "@/db/settings";
import { getAllTeamMembers } from "@/db/team-members";
import { getLatestSyncRun } from "@/db/sync-runs";
import { listRepositories } from "@/db/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const settingsConfigured = hasSetting("github_pat") && listRepositories().length > 0 && hasSetting("llm_api_key");

  const teamConfigured = getAllTeamMembers().length > 0;

  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");
  let syncHasRun = false;
  let syncStatus: "running" | "success" | "error" | null = null;

  if (owner && repo) {
    const latestRun = getLatestSyncRun(`${owner}/${repo}`);
    if (latestRun) {
      syncHasRun = true;
      syncStatus = latestRun.status as "running" | "success" | "error";
    }
  }

  return NextResponse.json({
    settings: { configured: settingsConfigured },
    team: { configured: teamConfigured },
    sync: { hasRun: syncHasRun, status: syncStatus },
  });
}
