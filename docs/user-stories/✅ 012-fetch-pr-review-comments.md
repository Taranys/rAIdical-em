# US-012: Fetch PR Review Comments from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want the application to fetch all review comments from pull requests so that review content is available for future categorization (Phase 2).

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — PRs must be fetched first so comments can be linked to them

## Acceptance Criteria

- [x] During sync, for each PR, the app fetches review comments (line-level comments) via the GitHub API
- [x] Stored data: comment ID, PR number, reviewer username, body (raw text), file path, line number, created date, updated date
- [x] General PR comments (non-review, issue-style comments) are also fetched and stored separately
- [x] Comments are upserted on re-sync

## Plan and implementation details

### Implementation

- Created `src/db/review-comments.ts` DAL with `upsertReviewComment`, `getReviewCommentCount`, and `getReviewCommentsByPR` functions following the existing DAL pattern (optional `dbInstance` parameter, upsert on `githubId` conflict).
- Created `src/db/pr-comments.ts` DAL with `upsertPrComment`, `getPrCommentCount`, and `getPrCommentsByPR` functions for general PR discussion comments.
- Extended `src/lib/github-sync.ts` to fetch both review comments (`octokit.rest.pulls.listReviewComments`) and PR comments (`octokit.rest.issues.listComments`) for ALL PRs during sync, with error handling that continues sync if comment fetching fails for individual PRs.
- Updated `completeSyncRun` and `updateSyncRunProgress` in `src/db/sync-runs.ts` to accept and store `commentCount`.
- Added integration tests for both DAL modules and unit tests for the extended sync service.
