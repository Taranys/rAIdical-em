# US-018: View Comments per Review per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see the average number of review comments each team member leaves per PR reviewed so that I can gauge review depth.

## Dependencies

- ❌ [US-012: Fetch PR Review Comments](❌%20012-fetch-pr-review-comments.md) — review comment data must be synced before it can be displayed
- 🏗️ [US-019: Dashboard Period Selector](🏗️%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [ ] The dashboard shows average comments per review, per team member
- [ ] Only review comments (not general PR comments) are counted
- [ ] A low average could indicate rubber-stamping; a high average could indicate thoroughness — both are surfaced without judgment (data informs, humans decide)

## Plan and implementation details

_To be filled before implementation._
