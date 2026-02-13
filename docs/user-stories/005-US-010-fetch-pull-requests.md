# Plan 005: US-010 — Fetch Pull Requests from GitHub

## Overview

Implement a sync system that fetches all pull requests from the configured GitHub repository via Octokit, stores them in SQLite with upsert semantics, and provides a dedicated sync page with real-time progress and rate limit visibility.

## Architecture

### Data Access Layer
- `src/db/pull-requests.ts` — `upsertPullRequest()` (insert/update on githubId conflict), `getPullRequestCount()`
- `src/db/sync-runs.ts` — `createSyncRun()`, `completeSyncRun()`, `updateSyncRunProgress()`, `getLatestSyncRun()`, `getActiveSyncRun()`

### Sync Service
- `src/lib/github-sync.ts` — `syncPullRequests()` uses `octokit.paginate()` for full pagination, maps GitHub PR state (open/closed + merged_at → merged), upserts each PR, updates sync run on completion/error. `fetchRateLimit()` returns current API usage.

### API Routes
- `POST /api/sync` — Validates prerequisites (PAT, repo, no active sync), creates sync run, starts sync in background (fire-and-forget)
- `GET /api/sync` — Returns latest sync run status for polling
- `GET /api/sync/rate-limit` — Returns current GitHub API rate limit info

### Frontend
- `/sync` page — Client component with status indicator (never synced / syncing / up to date / error), Sync Now button, rate limit progress bar
- Polling: 1s interval while status is "running", stops when sync completes
- Sidebar: "Sync" link added between Team and Settings

## Key Decisions
- Polling over SSE/WebSocket for simplicity (KISS)
- Background sync via fire-and-forget promise (no need for job queue)
- State derived from `merged_at` field (GitHub returns closed + merged_at for merged PRs)
- All PRs fetched; filtering by team member deferred to display time
- `aiGenerated` field left as default (0) — future story

## Files Created/Modified
- `src/db/pull-requests.ts` (new)
- `src/db/sync-runs.ts` (new)
- `src/lib/github-sync.ts` (new)
- `src/app/api/sync/route.ts` (new)
- `src/app/api/sync/rate-limit/route.ts` (new)
- `src/app/sync/page.tsx` (new)
- `src/components/app-sidebar.tsx` (modified — added Sync nav item)
- Tests: 6 test files (integration, unit, component, E2E)
