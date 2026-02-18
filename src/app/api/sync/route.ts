// US-010 / US-014: Sync API — trigger and check sync status
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import {
  createSyncRun,
  getLatestSyncRun,
  getLatestSuccessfulSyncRun,
  getActiveSyncRun,
  getSyncRunHistory,
} from "@/db/sync-runs";
import { syncPullRequests } from "@/lib/github-sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub PAT configured" },
      { status: 400 },
    );
  }

  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "No repository configured" },
      { status: 400 },
    );
  }

  const repository = `${owner}/${repo}`;
  const active = getActiveSyncRun(repository);
  if (active) {
    return NextResponse.json(
      { error: "A sync is already running" },
      { status: 409 },
    );
  }

  const syncRun = createSyncRun(repository);

  // US-014: Incremental sync — use last successful sync's completedAt as since
  const lastSuccessful = getLatestSuccessfulSyncRun(repository);
  const since = lastSuccessful?.completedAt ?? undefined;

  // Start sync in background — don't await
  syncPullRequests(owner, repo, token, syncRun.id, since);

  return NextResponse.json({ success: true, syncRunId: syncRun.id });
}

export async function GET() {
  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");

  if (!owner || !repo) {
    return NextResponse.json({ syncRun: null, history: [] });
  }

  const repository = `${owner}/${repo}`;
  const syncRun = getLatestSyncRun(repository);
  const history = getSyncRunHistory(repository, 10);
  return NextResponse.json({ syncRun, history });
}
