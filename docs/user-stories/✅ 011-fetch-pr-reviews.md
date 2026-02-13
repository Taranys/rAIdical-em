# US-011: Fetch PR Reviews from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want the application to fetch all reviews for each pull request so that I can track who reviewed what and how often.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — PRs must be fetched first so reviews can be linked to them

## Acceptance Criteria

- [x] During sync, for each PR, the app fetches reviews via the GitHub API
- [x] Stored data: review ID, PR number, reviewer username, review state (APPROVED, CHANGES_REQUESTED, COMMENTED), submitted date
- [x] Reviews are upserted on re-sync

## Plan and implementation details

### Plan

1. **Migration DB** — Add `review_count` column to `sync_runs` table to track review sync progress
2. **DAL Reviews** — Create `src/db/reviews.ts` with `upsertReview` and `getReviewCount` functions following the existing upsert pattern from `pull-requests.ts`
3. **Modify sync-runs DAL** — Extend `completeSyncRun` and `updateSyncRunProgress` to accept and store `reviewCount`
4. **Extend github-sync** — After upserting each PR, if the PR state is `open`, fetch reviews via `octokit.rest.pulls.listReviews` and upsert each one. Reviews are NOT fetched for merged/closed PRs to minimize API calls.
5. **Update sync page UI** — Display review count alongside PR count in all sync states (running, success, error)

### Implementation notes

- Reviews are only fetched for **open PRs** to optimize GitHub API usage (merged/closed PRs are stable)
- The `reviews` table schema already existed from US-022; no new table creation needed
- Added `review_count` column to `sync_runs` via Drizzle migration `0002_green_red_shift.sql`
- `upsertReview` uses `onConflictDoUpdate` on `github_id` for idempotent re-syncs
- The DB primary key (`pullRequestId`) is obtained from `upsertPullRequest` return value to set the FK correctly
- All functions follow TDD: tests written first (RED), then implementation (GREEN)
- 289 tests pass, lint clean, production build succeeds
