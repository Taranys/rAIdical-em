# US-013: View Sync Status and History

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see when the last sync happened and whether it succeeded so that I know if my data is up to date.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — sync must exist before its status can be displayed
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to sync page

## Acceptance Criteria

- [x] The sync page shows: last sync timestamp, sync status (success/failure/in progress), number of PRs and comments fetched
- [x] A sync history log shows the last N sync runs with their status and counts
- [x] During an active sync, a progress indicator is shown

## Plan and implementation details

### Plan

1. **DAL**: Add `getSyncRunHistory(repository, limit, dbInstance)` function to `src/db/sync-runs.ts`
2. **API**: Expand `GET /api/sync` to return `{ syncRun, history }` (backward-compatible)
3. **Hook**: Create `useSyncStatus` shared hook in `src/hooks/use-sync-status.ts` with polling logic, shared `SyncRun` interface
4. **Sync page**: Refactor to use shared hook, add `SyncHistoryTable` component with Table UI, display `commentCount`
5. **Sidebar**: Add `SyncStatusDot` component with independent polling (2s interval) — colored dot (green/red/blue-pulse)
6. **E2E**: Add test for sync history section visibility

### Implementation notes

- **`src/db/sync-runs.ts`**: Added `getSyncRunHistory` — returns last N runs ordered by desc ID using `.all()`
- **`src/app/api/sync/route.ts`**: GET now returns `{ syncRun, history }`. No new API endpoint needed.
- **`src/hooks/use-sync-status.ts`**: New shared hook with `SyncRun` interface (includes `commentCount`). Configurable polling interval, auto-start/stop polling.
- **`src/app/sync/page.tsx`**: Refactored to use `useSyncStatus` hook. Added `SyncHistoryTable` with Started, Status (badge), PRs, Comments, Duration columns. Added `formatDuration` and `StatusBadge` helpers. Displays commentCount in status indicator.
- **`src/components/app-sidebar.tsx`**: Added inline sync status polling (2s) and `SyncStatusDot` component showing colored dot next to "Sync" nav item.
- **Tests**: 4 new integration tests for DAL, 3 updated + new API route tests, 6 hook tests, 3 new page component tests, 4 new sidebar tests, 1 new E2E test. All 292 unit/integration tests pass. All 20 E2E tests pass.
