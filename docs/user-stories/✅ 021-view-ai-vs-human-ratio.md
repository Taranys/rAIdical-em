# US-021: View AI vs. Human Authorship Ratio

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see the ratio of AI-generated vs. human-written PRs per team member so that I can understand how AI adoption evolves across the team.

## Dependencies

- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — PR data must be synced before it can be classified
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period selector must exist to filter the data
- ✅ [US-020: Define AI Authorship Heuristic](✅%20020-define-ai-authorship-heuristic.md) — heuristic rules must be configured to classify PRs

## Acceptance Criteria

- [x] The dashboard shows a stacked bar chart or percentage breakdown per team member: AI / Human / Mixed
- [x] The global date range filter applies
- [x] A team-level aggregate is also shown (total AI vs. human across all members)

## Plan and implementation details

### Implementation

- **DAL** (`src/db/pull-requests.ts`): Added `getAiRatioByMember()` (group by author + ai_generated) and `getAiRatioTeamTotal()` (group by ai_generated only).
- **API route** (`src/app/api/dashboard/ai-ratio/route.ts`): GET with `startDate`/`endDate` params, returns `{ byMember, teamTotal }`.
- **Component** (`src/app/ai-ratio-card.tsx`): Stacked horizontal bar chart (Human=green, AI=violet, Mixed=orange) per team member + team aggregate with percentage breakdown.
- **Dashboard** (`src/app/dashboard-content.tsx`): Added `AiRatioCard` to the dashboard grid.
- **Tests**: Integration tests for DAL (with explicit `ai_generated` values via raw SQL), unit tests for API route, component tests with mocked Recharts.
