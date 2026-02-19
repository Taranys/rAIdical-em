# US-018: View Comments per Review per Team Member

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see the average number of review comments each team member leaves per PR reviewed so that I can gauge review depth.

## Dependencies

- ✅ [US-012: Fetch PR Review Comments](✅%20012-fetch-pr-review-comments.md) — review comment data must be synced before it can be displayed
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to dashboard page

## Acceptance Criteria

- [x] The dashboard shows average comments per review, per team member
- [x] Only review comments (not general PR comments) are counted
- [x] A low average could indicate rubber-stamping; a high average could indicate thoroughness — both are surfaced without judgment (data informs, humans decide)

## Plan and implementation details

### Implementation

- **DAL** (`src/db/review-comments.ts`): Added `getAvgCommentsPerReviewByMember()` — queries `review_comments` table (NOT `pr_comments`) grouped by reviewer, computing `COUNT(*)`, `COUNT(DISTINCT pull_request_id)`, and `CAST(COUNT(*) AS REAL) / COUNT(DISTINCT pull_request_id)` as avg.
- **API route** (`src/app/api/dashboard/comments-per-review/route.ts`): GET with `startDate`/`endDate` query params, returns `{ data: [...] }`.
- **Component** (`src/app/comments-per-review-card.tsx`): Horizontal bar chart (avg comments/review per member) + detail table with total comments, PRs reviewed, and avg per review. Team average displayed in card description. Data is presented neutrally without judgment.
- **Dashboard** (`src/app/dashboard-content.tsx`): Added `CommentsPerReviewCard` to the dashboard grid.
- **Tests**: Integration tests for DAL, unit tests for API route, component tests with mocked Recharts.
