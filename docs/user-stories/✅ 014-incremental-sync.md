# US-014: Incremental Sync

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want subsequent syncs to only fetch new or updated data so that syncing is fast and doesn't hit rate limits unnecessarily.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — a full sync must have run at least once

## Acceptance Criteria

- [x] After the first full sync, subsequent syncs only fetch PRs updated after the last sync timestamp
- [x] The sync uses the `since` parameter on the GitHub API where available
- [x] Newly updated PRs have their reviews and comments re-fetched

## Plan and implementation details

### Implementation

- Added optional `since?: string` parameter to `syncPullRequests` in `src/lib/github-sync.ts`. When provided, it is passed to `octokit.rest.pulls.list` to filter PRs by `updated_at >= since`.
- Added `getLatestSuccessfulSyncRun` function in `src/db/sync-runs.ts` to query the last sync run with `status: "success"`.
- Updated `src/app/api/sync/route.ts` POST handler to look up the last successful sync run and pass its `completedAt` timestamp as the `since` parameter.
- First sync (no previous successful run) remains a full sync with no `since` parameter.
- When doing incremental sync, reviews and comments are still fetched for all returned PRs (they were updated since last sync).
- Added unit tests in `src/lib/github-sync.test.ts` verifying `since` is passed when provided and omitted when undefined, and API route tests in `src/app/api/sync/route.test.ts` verifying the incremental sync behavior.
