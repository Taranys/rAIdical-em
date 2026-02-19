# US-019: Dashboard Period Selector

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to filter all dashboard metrics by a time period so that I can compare trends across sprints or quarters.

## Dependencies

- ✅ [US-015: View PRs Opened per Team Member](✅%20015-view-prs-opened.md) — at least one metric view must exist for the period selector to filter
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [x] A global period selector at the top of the dashboard applies to all metric cards
- [x] Preset options based on calendar boundaries:
  - **This week / Last week** — ISO week (Monday to Sunday)
  - **This sprint / Last sprint** — 2-week sprint periods (configurable start date)
  - **This month / Last month** — calendar month (e.g., January, February)
  - **This quarter / Last quarter** — calendar quarter (Q1, Q2, Q3, Q4)
- [x] The selected period persists during the session (not across page reloads)

## Plan and implementation details

### Implementation plan

- React Context (`PeriodProvider` + `usePeriod()`) for session-only period state
- Pure utility library `src/lib/date-periods.ts` for computing date ranges from presets
- shadcn/ui `Select` component for period dropdown
- Default period: "This month"

### Implementation notes

- **Period context**: `src/app/dashboard-context.tsx` — `PeriodProvider` wraps all dashboard metric cards
- **Period selector**: `src/app/period-selector.tsx` — dropdown with 8 presets, shows computed date range as subtitle
- **Date utilities**: `src/lib/date-periods.ts` — `getDateRangeForPreset()`, ISO week, quarter, sprint, month calculations
- **Tests**: 24 unit tests for date-periods, component tests for period selector
- Sprint origin: 2024-01-01 (a Monday), 2-week periods aligned to this origin
