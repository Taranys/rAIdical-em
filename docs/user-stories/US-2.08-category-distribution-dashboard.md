# US-2.08: Category Distribution Dashboard

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As an engineering manager, I want to see how review comment categories are distributed across my team so that I can identify review patterns and gaps.

## Acceptance Criteria

- [ ] The Review Quality page includes a dashboard section with aggregate charts
- [ ] Chart 1: **Team-wide category breakdown** — pie or donut chart showing the proportion of each category across all comments
- [ ] Chart 2: **Per-person category breakdown** — stacked bar chart with one bar per team member, showing their category distribution
- [ ] Chart 3: **Category trend over time** — line chart showing how category proportions evolve week over week
- [ ] All charts respect the active period selector (US-019) and team member filters
- [ ] Hovering on chart segments shows exact counts and percentages
- [ ] Charts are implemented using a React charting library (e.g., Recharts)

## Dependencies

- [US-2.07: View Classification Results](US-2.07-view-classification-results.md) — classification data must be viewable
- [US-019: Dashboard Period Selector](019-dashboard-period-selector.md) — period filter must be reusable
