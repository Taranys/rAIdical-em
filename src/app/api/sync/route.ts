// US-010 / US-014 / US-025 / Multi-repo support: Sync API — trigger and check sync status
import { NextResponse } from "next/server";
import { getSetting } from "@/db/settings";
import {
  createSyncRun,
  getLatestSyncRun,
  getLatestSuccessfulSyncRun,
  getAnyActiveSyncRun,
  getSyncRunHistoryAll,
  getLatestSuccessfulSyncRunByRepoId,
} from "@/db/sync-runs";
import { listRepositories, findRepositoryById } from "@/db/repositories";
import { syncPullRequests } from "@/lib/github-sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getSetting("github_pat");
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub PAT configured" },
      { status: 400 },
    );
  }

  // Check if any sync is already running
  const active = getAnyActiveSyncRun();
  if (active) {
    return NextResponse.json(
      { error: "A sync is already running" },
      { status: 409 },
    );
  }

  // Parse optional body
  let sinceDate: string | undefined;
  let repositoryId: number | undefined;
  try {
    const body = await request.json();
    if (body.sinceDate) sinceDate = body.sinceDate;
    if (body.repositoryId) repositoryId = body.repositoryId;
  } catch {
    // No body or invalid JSON — OK
  }

  // Determine which repos to sync
  const repos = repositoryId
    ? [findRepositoryById(repositoryId)].filter(Boolean)
    : listRepositories();

  if (repos.length === 0) {
    // Fallback: check legacy settings for backward compat
    const owner = getSetting("github_owner");
    const repo = getSetting("github_repo");
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "No repositories configured" },
        { status: 400 },
      );
    }
    const repository = `${owner}/${repo}`;
    const syncRun = createSyncRun(repository);
    let since = sinceDate;
    if (!since) {
      const lastSuccessful = getLatestSuccessfulSyncRun(repository);
      since = lastSuccessful?.completedAt ?? undefined;
    }
    syncPullRequests(owner, repo, token, syncRun.id, since);
    return NextResponse.json({ success: true, syncRunId: syncRun.id });
  }

  // Multi-repo: sync sequentially
  const syncRunIds: number[] = [];
  for (const repoRecord of repos) {
    if (!repoRecord) continue;
    const repository = `${repoRecord.owner}/${repoRecord.name}`;
    const syncRun = createSyncRun(repository, undefined, repoRecord.id);
    syncRunIds.push(syncRun.id);

    let since = sinceDate;
    if (!since) {
      const lastSuccessful = getLatestSuccessfulSyncRunByRepoId(repoRecord.id);
      since = lastSuccessful?.completedAt ?? undefined;
    }

    // Sequential: await each repo sync before starting next
    await syncPullRequests(repoRecord.owner, repoRecord.name, token, syncRun.id, since, repoRecord.id);
  }

  return NextResponse.json({ success: true, syncRunIds });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repositoryId = searchParams.get("repositoryId");

  if (repositoryId) {
    const repoIdNum = parseInt(repositoryId, 10);
    const history = getSyncRunHistoryAll(20, repoIdNum);
    const syncRun = history[0] ?? null;
    return NextResponse.json({ syncRun, history });
  }

  // Check if repos are configured
  const repos = listRepositories();
  if (repos.length > 0) {
    const history = getSyncRunHistoryAll(20);
    const syncRun = history[0] ?? null;
    return NextResponse.json({ syncRun, history });
  }

  // Fallback: legacy single-repo
  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");

  if (!owner || !repo) {
    return NextResponse.json({ syncRun: null, history: [] });
  }

  const repository = `${owner}/${repo}`;
  const syncRun = getLatestSyncRun(repository);
  const history = getSyncRunHistoryAll(10);
  return NextResponse.json({ syncRun, history });
}
