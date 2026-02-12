# US-015: View PRs Opened per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see how many PRs each team member opened over a given period so that I can understand individual throughput.

## Acceptance Criteria

- [ ] The dashboard (`/dashboard` or `/`) shows a bar chart or table of PRs opened per team member for the selected period
- [ ] A weekly trend chart shows the number of PRs opened per week over the selected period
- [ ] Only PRs authored by tracked team members are counted

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — PR data must be synced before it can be displayed
- [US-019: Dashboard Period Selector](019-dashboard-period-selector.md) — period selector must exist to filter the data
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to dashboard page
