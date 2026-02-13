// US-010: GitHub PR sync service
import type { Octokit } from "octokit";
import type { PullRequestInput } from "@/db/pull-requests";

export interface SyncProgress {
  fetched: number;
  currentPage: number;
}

export interface SyncResult {
  prCount: number;
  durationMs: number;
}

export interface SyncCallbacks {
  onProgress: (progress: SyncProgress) => void;
  onError: (error: string) => void;
}

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  user: { login: string } | null;
  state: string;
  created_at: string;
  merged_at: string | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export function mapPullRequest(pr: GitHubPR): PullRequestInput {
  const state: PullRequestInput["state"] =
    pr.state === "closed" && pr.merged_at
      ? "merged"
      : pr.state === "closed"
        ? "closed"
        : "open";

  return {
    githubId: pr.id,
    number: pr.number,
    title: pr.title,
    author: pr.user?.login ?? "unknown",
    state,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at ?? null,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    changedFiles: pr.changed_files ?? 0,
  };
}

export async function syncPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  upsertBatch: (prs: PullRequestInput[]) => void,
  callbacks: SyncCallbacks,
): Promise<SyncResult> {
  const startTime = Date.now();
  let totalFetched = 0;
  let currentPage = 0;

  const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "all",
    per_page: 100,
    sort: "created",
    direction: "desc",
  });

  for await (const { data: prs } of iterator) {
    currentPage++;
    const mapped = (prs as unknown as GitHubPR[]).map(mapPullRequest);
    upsertBatch(mapped);
    totalFetched += prs.length;
    callbacks.onProgress({ fetched: totalFetched, currentPage });
  }

  return {
    prCount: totalFetched,
    durationMs: Date.now() - startTime,
  };
}
