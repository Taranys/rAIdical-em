# US-010: Fetch Pull Requests from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want the application to fetch all pull requests from the configured repository so that PR data is available locally for metrics.

## Dependencies

- ✅ [US-005: Configure GitHub PAT](✅%20005-configure-github-pat.md) — a valid PAT is required to call the GitHub API
- ✅ [US-006: Configure Target Repository](✅%20006-configure-target-repository.md) — a repository must be configured to know what to fetch
- ✅ [US-022: Database Schema](✅%20022-database-schema-phase1.md) — pull_requests and sync_runs tables must exist
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to sync page

## Acceptance Criteria

- [x] A dedicated sync page shows the sync process with real-time progress (PRs fetched, current step, errors)
- [x] A "Sync" action (manual trigger) fetches PRs from the GitHub API via Octokit
- [x] Fetched data includes: PR number, title, author, state (open/closed/merged), created date, merged date, additions, deletions, changed files count
- [x] PRs are stored in the SQLite database (upserted — no duplicates on re-sync)
- [x] The sync respects GitHub API rate limits and handles pagination
- [x] All PRs are fetched and stored; filtering by team member happens at display time

## Plan and implementation details

**Goal:** Sync page with manual trigger that fetches all PRs from GitHub, stores them in SQLite with upsert, and shows real-time progress via polling.

**Architecture — polling-based sync:**
- Client polls `GET /api/sync` every 1s while status is "running", stops on completion
- `POST /api/sync` starts a background sync (fire-and-forget promise, no job queue)
- PR state derived from `merged_at` field: GitHub returns `state: "closed"` + `merged_at` for merged PRs → mapped to `"merged"`

**Changes:**
- **Pull requests DAL** (`src/db/pull-requests.ts`): `upsertPullRequest()` with `onConflictDoUpdate` on `githubId`, `getPullRequestCount()`. Accepts optional `dbInstance` for testability.
- **Sync runs DAL** (`src/db/sync-runs.ts`): `createSyncRun()`, `completeSyncRun()` (handles success/error), `updateSyncRunProgress()`, `getLatestSyncRun()`, `getActiveSyncRun()`.
- **Sync service** (`src/lib/github-sync.ts`): `syncPullRequests()` uses `octokit.paginate(pulls.list)` for pagination, then `pulls.get` per PR for additions/deletions/changed_files (list endpoint doesn't include these). `fetchRateLimit()` returns current API usage.
- **API routes**: `POST /api/sync` (validates PAT/repo, prevents concurrent syncs with 409), `GET /api/sync` (latest sync run for polling), `GET /api/sync/rate-limit` (GitHub API rate limit info).
- **Sync page** (`src/app/sync/page.tsx`): Client component with status indicator (never synced/syncing/up to date/error), "Sync Now" button, rate limit progress bar. Uses lucide-react icons.
- **Sidebar** (`src/components/app-sidebar.tsx`): Added "Sync" nav item with RefreshCw icon between Team and Settings.
- **Tests:** 6 integration tests (pull requests DAL), 9 integration tests (sync runs DAL), 9 unit tests (github-sync service), 7 unit tests (sync API), 3 unit tests (rate-limit API), 6 component tests (sync page), 1 E2E test (sync page navigation).

**Key decisions:**
- Polling over SSE/WebSocket for simplicity (KISS)
- Per-PR detail fetch (`pulls.get`) needed because `pulls.list` doesn't return `additions`/`deletions`/`changed_files`
- `aiGenerated` field left as default — classification handled by US-020
