# US-025: Sync Progress per Team Member with Quarter Date Range

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see sync progress broken down by team member and choose a starting quarter so that I only fetch relevant PR data and can track each member's contribution during the sync.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — sync infrastructure must exist (sync page, API routes, DAL)
- ✅ [US-007: Add a Team Member](✅%20007-add-team-member.md) — team members must be configured to filter PRs by author
- ✅ [US-009: View Team Member List](✅%20009-view-team-member-list.md) — team member list must be available

## Acceptance Criteria

- [x] The sync page displays a quarter selector (e.g., "Since Q4 2025") that determines the start date for fetching PRs
- [x] The default selection is "since the beginning of the previous quarter" (e.g., in Q1 2026, defaults to "Since Q4 2025" → PRs from October 1, 2025 onward)
- [x] At least one team member must be configured before syncing; if none exist, the sync page shows a message directing the user to the Team page
- [x] During sync, progress is displayed per team member (e.g., "octocat: 12 PRs, alice: 8 PRs") instead of a single global counter
- [x] The GitHub API query is filtered by the selected start date (using the `since` parameter or equivalent) to avoid fetching unnecessary historical data
- [x] PRs are still stored globally (all PRs from the repo), but progress tracking groups them by author matching configured team members
- [x] A summary row shows total PRs fetched across all members plus PRs from non-team-member authors

## Plan and implementation details

### Implementation

- **Sync page** (`src/app/sync/page.tsx`): Added quarter selector using `getQuarterOptions()` from date-periods, team member check (fetches `/api/team` and shows "Add team members" link to `/team` if empty, disables Sync button), progress per member card with polling during sync, and summary row.
- **API route POST** (`src/app/api/sync/route.ts`): Now accepts `Request` parameter and reads `sinceDate` from JSON body to override incremental sync. Falls back to incremental sync (`lastSuccessful.completedAt`) if no sinceDate provided.
- **Progress API** (`src/app/api/sync/progress/route.ts`): New GET endpoint with `sinceDate` query param. Returns `teamProgress` (PRs per team member), `nonTeamCount`, and `totalCount` by querying `getPRCountByAuthor()`.
- **DAL** (`src/db/pull-requests.ts`): Added `getPRCountByAuthor(startDate)` — counts all PRs by author since a given date (no team filter, progress endpoint handles filtering).
- **Tests**: Updated sync route tests to pass Request to POST, added sinceDate override tests, updated sync page tests to handle new endpoints (team, progress), added progress route tests.
