# US-019: Dashboard Period Selector

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to filter all dashboard metrics by a time period so that I can compare trends across sprints or quarters.

## Acceptance Criteria

- [ ] A global period selector at the top of the dashboard applies to all metric cards
- [ ] Preset options based on calendar boundaries:
  - **This week / Last week** — ISO week (Monday to Sunday)
  - **This sprint / Last sprint** — 2-week sprint periods (configurable start date)
  - **This month / Last month** — calendar month (e.g., January, February)
  - **This quarter / Last quarter** — calendar quarter (Q1, Q2, Q3, Q4)
- [ ] The selected period persists during the session (not across page reloads)

## Dependencies

- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to dashboard page
