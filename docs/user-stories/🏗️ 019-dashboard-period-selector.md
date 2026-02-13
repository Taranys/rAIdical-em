# US-019: Dashboard Period Selector

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to filter all dashboard metrics by a time period so that I can compare trends across sprints or quarters.

## Dependencies

- 🏗️ [US-015: View PRs Opened per Team Member](🏗️%20015-view-prs-opened.md) — at least one metric view must exist for the period selector to filter
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [ ] A global period selector at the top of the dashboard applies to all metric cards
- [ ] Preset options based on calendar boundaries:
  - **This week / Last week** — ISO week (Monday to Sunday)
  - **This sprint / Last sprint** — 2-week sprint periods (configurable start date)
  - **This month / Last month** — calendar month (e.g., January, February)
  - **This quarter / Last quarter** — calendar quarter (Q1, Q2, Q3, Q4)
- [ ] The selected period persists during the session (not across page reloads)

## Plan and implementation details

_To be filled before implementation._
