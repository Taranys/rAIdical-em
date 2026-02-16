// US-010 / US-011: GitHub sync service — fetch PRs, reviews, and rate limit info
import { Octokit } from "octokit";
import { upsertPullRequest } from "@/db/pull-requests";
import { upsertReview } from "@/db/reviews";
import { updateSyncRunProgress, completeSyncRun } from "@/db/sync-runs";


function mapPRState(pr: { state: string; merged_at: string | null }): "open" | "closed" | "merged" {
  if (pr.merged_at) return "merged";
  return pr.state as "open" | "closed";
}

export async function syncPullRequests(
  owner: string,
  repo: string,
  token: string,
  syncRunId: number,
) {
  const octokit = new Octokit({ auth: token });
  let prCount = 0;
  let reviewCount = 0;

  try {
    // List all PRs (doesn't include additions/deletions/changed_files)
    const prList = await octokit.paginate(
      octokit.rest.pulls.list,
      { owner, repo, state: "all", per_page: 100 },
    );

    // Fetch detail for each PR to get stats
    for (const item of prList) {
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: item.number,
      });

      const state = mapPRState(pr);
      const dbPR = upsertPullRequest({
        githubId: pr.id,
        number: pr.number,
        title: pr.title,
        author: pr.user?.login ?? "unknown",
        state,
        createdAt: pr.created_at,
        mergedAt: pr.merged_at,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
      });
      prCount++;

      // US-011: Fetch reviews only for open PRs
      if (state === "open") {
        const { data: reviews } = await octokit.rest.pulls.listReviews({
          owner,
          repo,
          pull_number: pr.number,
        });

        for (const review of reviews) {
          upsertReview({
            githubId: review.id,
            pullRequestId: dbPR.id,
            reviewer: review.user?.login ?? "unknown",
            state: review.state,
            submittedAt: review.submitted_at ?? new Date().toISOString(),
          });
          reviewCount++;
        }
      }

      updateSyncRunProgress(syncRunId, prCount, reviewCount);
    }

    completeSyncRun(syncRunId, "success", prCount, null, reviewCount);
  } catch (error) {
    completeSyncRun(
      syncRunId,
      "error",
      prCount,
      error instanceof Error ? error.message : "Unknown error",
      reviewCount,
    );
  }

  return prCount;
}

export async function fetchRateLimit(token: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.rateLimit.get();

  return {
    limit: data.rate.limit,
    remaining: data.rate.remaining,
    resetAt: new Date(data.rate.reset * 1000).toISOString(),
  };
}
