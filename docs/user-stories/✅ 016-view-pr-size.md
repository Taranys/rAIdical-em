# US-016: View PR Size per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see the average PR size (lines added/removed) per team member so that I can spot overly large PRs and encourage smaller, reviewable changes.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — PR data must be synced before it can be displayed
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [x] The dashboard shows average additions and deletions per PR, per team member
- [x] A visual indicator (e.g., color coding) highlights PRs above a configurable threshold (default: 500 lines)
- [x] Clicking a team member drills down to their individual PR list with sizes

## Plan and implementation details

### Implementation notes

- **DAL**: `getAvgPRSizeByMember()` for averages, `getPRsByMember()` for drill-down
- **API**: `GET /api/dashboard/pr-size` for averages, `GET /api/dashboard/pr-size/[author]` for individual PRs
- **UI**: `src/app/pr-size-card.tsx` — table with expandable rows, red background for avg total > 500 lines
- **Drill-down**: Click a member row to expand inline sub-table with individual PR details (number, title, +/- lines, files)
