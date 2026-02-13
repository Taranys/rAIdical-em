# US-025: Sync Progress per Team Member with Quarter Date Range

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see sync progress broken down by team member and choose a starting quarter so that I only fetch relevant PR data and can track each member's contribution during the sync.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — sync infrastructure must exist (sync page, API routes, DAL)
- ✅ [US-007: Add a Team Member](✅%20007-add-team-member.md) — team members must be configured to filter PRs by author
- ✅ [US-009: View Team Member List](✅%20009-view-team-member-list.md) — team member list must be available

## Acceptance Criteria

- [ ] The sync page displays a quarter selector (e.g., "Since Q4 2025") that determines the start date for fetching PRs
- [ ] The default selection is "since the beginning of the previous quarter" (e.g., in Q1 2026, defaults to "Since Q4 2025" → PRs from October 1, 2025 onward)
- [ ] At least one team member must be configured before syncing; if none exist, the sync page shows a message directing the user to the Team page
- [ ] During sync, progress is displayed per team member (e.g., "octocat: 12 PRs, alice: 8 PRs") instead of a single global counter
- [ ] The GitHub API query is filtered by the selected start date (using the `since` parameter or equivalent) to avoid fetching unnecessary historical data
- [ ] PRs are still stored globally (all PRs from the repo), but progress tracking groups them by author matching configured team members
- [ ] A summary row shows total PRs fetched across all members plus PRs from non-team-member authors

## Plan and implementation details

_To be filled before implementation._
