# US-017: View PRs Reviewed per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see how many PRs each team member reviewed over a given period so that I can identify review load imbalances.

## Dependencies

- ✅ [US-011: Fetch PR Reviews](✅%20011-fetch-pr-reviews.md) — review data must be synced before it can be displayed
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [x] The dashboard shows a count of PRs reviewed per team member for the selected period
- [x] "Reviewed" means the member submitted at least one review (APPROVED, CHANGES_REQUESTED, or COMMENTED)
- [x] The list is ordered from the most active reviewer to the least active reviewer
- [x] The chart/table allows comparison across the team

## Plan and implementation details

### Implementation notes

- **DAL**: `getPRsReviewedByMember()` uses `COUNT(DISTINCT pull_request_id)` to count unique PRs reviewed, ordered DESC
- **API**: `GET /api/dashboard/prs-reviewed?startDate=...&endDate=...`
- **UI**: `src/app/prs-reviewed-card.tsx` — horizontal Recharts BarChart + ranked table with position numbers
