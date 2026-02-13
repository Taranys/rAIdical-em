# US-017: View PRs Reviewed per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see how many PRs each team member reviewed over a given period so that I can identify review load imbalances.

## Dependencies

- 🏗️ [US-011: Fetch PR Reviews](🏗️%20011-fetch-pr-reviews.md) — review data must be synced before it can be displayed
- 🏗️ [US-019: Dashboard Period Selector](🏗️%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [ ] The dashboard shows a count of PRs reviewed per team member for the selected period
- [ ] "Reviewed" means the member submitted at least one review (APPROVED, CHANGES_REQUESTED, or COMMENTED)
- [ ] The list is ordered from the most active reviewer to the least active reviewer
- [ ] The chart/table allows comparison across the team

## Plan and implementation details

_To be filled before implementation._
