// US-010 / US-011 / US-012: GitHub sync service — fetch PRs, reviews, comments, and rate limit info
import { Octokit } from "octokit";
import { upsertPullRequest } from "@/db/pull-requests";
import { upsertReview } from "@/db/reviews";
import { upsertReviewComment } from "@/db/review-comments";
import { upsertPrComment } from "@/db/pr-comments";
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
  since?: string,
) {
  const octokit = new Octokit({ auth: token });
  let prCount = 0;
  let reviewCount = 0;
  let commentCount = 0;

  try {
    // List all PRs (doesn't include additions/deletions/changed_files)
    const listParams: Record<string, unknown> = {
      owner,
      repo,
      state: "all",
      per_page: 100,
    };
    if (since) {
      listParams.since = since;
    }

    const prList = await octokit.paginate(
      octokit.rest.pulls.list,
      listParams as Parameters<typeof octokit.rest.pulls.list>[0],
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

      // US-011: Fetch reviews for all PRs
      try {
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
      } catch {
        // Continue sync if review fetch fails for one PR
      }

      // US-012: Fetch review comments (inline code comments)
      try {
        const { data: reviewComments } = await octokit.rest.pulls.listReviewComments({
          owner,
          repo,
          pull_number: pr.number,
        });

        for (const comment of reviewComments) {
          upsertReviewComment({
            githubId: comment.id,
            pullRequestId: dbPR.id,
            reviewer: comment.user?.login ?? "unknown",
            body: comment.body ?? "",
            filePath: comment.path ?? null,
            line: comment.line ?? null,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
          });
          commentCount++;
        }
      } catch {
        // Continue sync if review comment fetch fails for one PR
      }

      // US-012: Fetch PR comments (issue-style general discussion comments)
      try {
        const { data: issueComments } = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: pr.number,
        });

        for (const comment of issueComments) {
          upsertPrComment({
            githubId: comment.id,
            pullRequestId: dbPR.id,
            author: comment.user?.login ?? "unknown",
            body: comment.body ?? "",
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
          });
          commentCount++;
        }
      } catch {
        // Continue sync if PR comment fetch fails for one PR
      }

      updateSyncRunProgress(syncRunId, prCount, reviewCount, commentCount);
    }

    completeSyncRun(syncRunId, "success", prCount, null, reviewCount, commentCount);
  } catch (error) {
    completeSyncRun(
      syncRunId,
      "error",
      prCount,
      error instanceof Error ? error.message : "Unknown error",
      reviewCount,
      commentCount,
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
