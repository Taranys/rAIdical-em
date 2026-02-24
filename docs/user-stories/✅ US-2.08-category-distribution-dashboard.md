# US-2.08: Category Distribution Dashboard

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As an engineering manager, I want to see how review comment categories are distributed across my team so that I can identify review patterns and gaps.

## Dependencies

- ✅ [US-2.07: View Classification Results](✅%20US-2.07-view-classification-results.md) — classification data must be viewable
- ✅ [US-019: Dashboard Period Selector](✅%20019-dashboard-period-selector.md) — period filter must be reusable

## Acceptance Criteria

- [x] The Review Quality page includes a dashboard section with aggregate charts
- [x] Chart 1: **Team-wide category breakdown** — pie or donut chart showing the proportion of each category across all comments
- [x] Chart 2: **Per-person category breakdown** — stacked bar chart with one bar per team member, showing their category distribution
- [x] Chart 3: **Category trend over time** — line chart showing how category proportions evolve week over week
- [x] All charts respect the active period selector (US-019) and team member filters
- [x] Hovering on chart segments shows exact counts and percentages
- [x] Charts are implemented using a React charting library (e.g., Recharts)

## Plan and implementation details

### Implementation plan

1. Add `chartColor` (hsl strings) to `CATEGORY_CONFIG` for Recharts consumption
2. New DAL functions: `getCategoryDistributionFiltered()` (team-wide with filters) and `getCategoryTrendByWeek()` (weekly trend)
3. New API endpoint `GET /api/review-quality/charts` returning all 3 datasets
4. Three chart components: `CategoryDonutChart`, `CategoryPerPersonChart`, `CategoryTrendChart`
5. Integration into `review-quality-content.tsx` — new "Category Charts" card section
6. Charts react to existing FilterBar (dateStart, dateEnd, reviewer)

### Implementation notes

- **Recharts v3.7.0** used for all charts (already installed)
- **Donut chart** uses `PieChart` with `innerRadius`/`outerRadius` for donut effect, custom `Tooltip` showing count + percentage
- **Stacked bar chart** follows `ai-ratio-card.tsx` pattern: horizontal `BarChart` with `layout="vertical"`, one `Bar` per category with `stackId="a"`
- **Line chart** uses multiple `Line` elements (one per category present in data), `type="monotone"`, `connectNulls`
- **Weekly grouping** uses SQLite `strftime('%Y-W%W', ...)`, same pattern as `getPRsMergedPerWeek`
- **Filter reactivity**: charts use `dateStart`, `dateEnd`, `reviewer` from FilterBar; `category` and `minConfidence` only apply to comments table
- **Single API endpoint** `/api/review-quality/charts` fetches all 3 datasets in one round-trip
- **TDD approach**: integration tests for DAL functions, unit tests for API route and components, E2E test updated
- Charts section placed between SummaryBar and FilterBar in page layout
