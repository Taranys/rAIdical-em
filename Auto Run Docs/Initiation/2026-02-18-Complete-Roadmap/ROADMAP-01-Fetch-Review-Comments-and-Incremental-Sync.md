# Phase 01: Fetch Review Comments & Incremental Sync (US-012, US-014)

This phase completes the GitHub data synchronization pipeline by adding review comment fetching (US-012) and incremental sync (US-014). These are the two remaining data-layer stories that have no UI dependencies and can be built autonomously. By the end, the sync will fetch PRs, reviews, AND comments — and subsequent syncs will be fast thanks to incremental fetching. This is the foundation that unblocks dashboard metrics (Phase 2) and the entire Phase 2 classification engine.

## Tasks

- [x] Create the review comments DAL (`src/db/review-comments.ts`) and PR comments DAL (`src/db/pr-comments.ts`) following the existing DAL patterns:
  - Review the existing patterns in `src/db/pull-requests.ts` and `src/db/reviews.ts` — follow the same structure (optional `dbInstance` parameter, `upsertX` function, `getXCount` function)
  - `src/db/review-comments.ts`: `upsertReviewComment(input, dbInstance?)` with fields from schema (githubId, pullRequestId, reviewer, body, filePath, line, createdAt, updatedAt), `getReviewCommentCount(dbInstance?)`, and `getReviewCommentsByPR(pullRequestId, dbInstance?)`
  - `src/db/pr-comments.ts`: `upsertPrComment(input, dbInstance?)` with fields from schema (githubId, pullRequestId, author, body, createdAt, updatedAt), `getPrCommentCount(dbInstance?)`, and `getPrCommentsByPR(pullRequestId, dbInstance?)`
  - Both use upsert on `githubId` conflict (same as existing DALs)

- [x] Write integration tests for both DAL modules:
  - `src/db/review-comments.integration.test.ts`: test upsert (insert + update on conflict), count, and getByPR — use in-memory SQLite (`:memory:`) following patterns from existing `src/db/pull-requests.integration.test.ts`
  - `src/db/pr-comments.integration.test.ts`: same test patterns for PR comments
  - Each test file must create its own in-memory DB, run migrations, and insert prerequisite data (a pull request row must exist for FK)

- [x] Run the DAL integration tests and fix any failures:
  - Run `npm run test:integration` to verify both new test files pass
  - Fix any issues found

- [x] Extend `src/lib/github-sync.ts` to fetch review comments and PR comments during sync:
  - Review the existing `syncPullRequests` function in `src/lib/github-sync.ts`
  - Import `upsertReviewComment` from `@/db/review-comments` and `upsertPrComment` from `@/db/pr-comments`
  - After fetching reviews for each PR, also fetch:
    - Review comments via `octokit.rest.pulls.listReviewComments({ owner, repo, pull_number })` — these are inline code comments
    - PR comments (issue-style) via `octokit.rest.issues.listComments({ owner, repo, issue_number: pr.number })` — these are general discussion comments
  - For each review comment: upsert with `{ githubId: comment.id, pullRequestId: dbPR.id, reviewer: comment.user?.login ?? "unknown", body: comment.body ?? "", filePath: comment.path ?? null, line: comment.line ?? null, createdAt: comment.created_at, updatedAt: comment.updated_at }`
  - For each PR comment: upsert with `{ githubId: comment.id, pullRequestId: dbPR.id, author: comment.user?.login ?? "unknown", body: comment.body ?? "", createdAt: comment.created_at, updatedAt: comment.updated_at }`
  - Track `commentCount` (sum of both types) alongside existing `prCount` and `reviewCount`
  - Pass `commentCount` to `updateSyncRunProgress` and `completeSyncRun`
  - Update `completeSyncRun` in `src/db/sync-runs.ts` to accept and store `commentCount` parameter (the schema column already exists)
  - IMPORTANT: Fetch comments for ALL PRs (not just open ones), since comments on merged PRs are valuable for Phase 2 analysis
  - Note: US-019 depends on US-015, but US-015 depends on data being there first. The period selector story dependency is noted as needing "at least one metric view" — we'll handle the circular dependency in Phase 2 by building the period selector alongside the first metric view.

- [x] Write unit tests for the extended github-sync service:
  - Extend existing tests in `src/lib/github-sync.test.ts`
  - Mock `octokit.rest.pulls.listReviewComments` and `octokit.rest.issues.listComments`
  - Test that review comments are fetched and upserted for each PR
  - Test that PR comments are fetched and upserted for each PR
  - Test that commentCount is tracked and passed to sync run completion
  - Test error handling (sync continues if comment fetch fails for one PR)

- [x] Run all tests and fix any failures:
  - Run `npm test` to verify all existing + new tests pass
  - Fix any issues found

- [x] Implement incremental sync (US-014) in `src/lib/github-sync.ts`:
  - Add an optional `since?: string` parameter to `syncPullRequests`
  - When `since` is provided, pass it to `octokit.rest.pulls.list` as `{ since }` parameter (GitHub filters by updated_at >= since)
  - In `src/app/api/sync/route.ts` POST handler: look up the last successful sync run via `getLatestSyncRun` — if one exists with status "success", pass its `completedAt` timestamp as the `since` parameter
  - When doing incremental sync, still fetch reviews and comments for ALL returned PRs (they were updated)
  - The first sync (no previous successful run) remains a full sync with no `since` parameter

- [x] Write tests for incremental sync:
  - Unit test in `src/lib/github-sync.test.ts`: verify `since` parameter is passed to Octokit when provided
  - Unit test: verify `since` is NOT passed when undefined (full sync behavior preserved)
  - API route test in `src/app/api/sync/route.test.ts`: verify the POST handler reads last successful sync and passes `completedAt` as `since`
  - API route test: verify first sync (no history) calls without `since`

- [x] Run all tests and fix any failures:
  - Run `npm test` to verify everything passes
  - Run `npm run lint` to verify no lint errors
  - Run `npm run build` to verify the project builds successfully
  - Note: Build has a pre-existing failure due to missing `vibe-kanban-web-companion` module (unrelated to this phase). All 368 tests pass, lint is clean.

- [x] Update user story files to reflect completion:
  - Update `docs/user-stories/🏗️ 012-fetch-pr-review-comments.md`: change status from `Todo` to `Done`, check off all acceptance criteria, rename file prefix from `🏗️` to `✅`, fill in the "Plan and implementation details" section with what was built
  - Update `docs/user-stories/🏗️ 014-incremental-sync.md`: same updates — status to `Done`, check criteria, rename prefix to `✅`, fill in implementation details
