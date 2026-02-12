# US-016: View PR Size per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see the average PR size (lines added/removed) per team member so that I can spot overly large PRs and encourage smaller, reviewable changes.

## Acceptance Criteria

- [ ] The dashboard shows average additions and deletions per PR, per team member
- [ ] A visual indicator (e.g., color coding) highlights PRs above a configurable threshold (default: 500 lines)
- [ ] Clicking a team member drills down to their individual PR list with sizes

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — PR data must be synced before it can be displayed
- [US-019: Dashboard Period Selector](019-dashboard-period-selector.md) — period selector must exist to filter the data
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to dashboard page
