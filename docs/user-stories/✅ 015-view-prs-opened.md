# US-015: View PRs Opened per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see how many PRs each team member opened over a given period so that I can understand individual throughput.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — PR data must be synced before it can be displayed
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [x] The dashboard (`/dashboard` or `/`) shows a bar chart or table of PRs opened per team member for the selected period
- [x] A weekly trend chart shows the number of PRs opened per week over the selected period
- [x] Only PRs authored by tracked team members are counted

## Plan and implementation details

### Implementation plan

- DAL functions: `getPRsOpenedByMember()` and `getPRsOpenedPerWeek()` with date range filtering
- API route: `GET /api/dashboard/prs-opened?startDate=...&endDate=...`
- Recharts horizontal BarChart for per-member counts, LineChart for weekly trend
- Dashboard page replaces placeholder with metric cards

### Implementation notes

- **DAL**: `src/db/pull-requests.ts` — `getPRsOpenedByMember()` uses GROUP BY author with inArray filter on team usernames; `getPRsOpenedPerWeek()` uses `strftime('%Y-W%W')` for weekly grouping
- **API**: `src/app/api/dashboard/prs-opened/route.ts` — fetches team members, delegates to DAL
- **UI**: `src/app/prs-opened-card.tsx` — Recharts BarChart (vertical layout) + LineChart for trend, shows total PR count and empty state
- **Dashboard**: `src/app/page.tsx` now shows `DashboardContent` with `PeriodProvider` wrapper
- **Tests**: 12 integration tests for DAL, 3 API route tests, 4 component tests
