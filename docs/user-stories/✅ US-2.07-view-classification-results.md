# US-2.07: View Comment Classification Results

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As an engineering manager, I want to view the classification of each review comment so that I can understand the nature and depth of my team's reviews.

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — classified data must exist
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation

## Acceptance Criteria

- [x] A new "Review Quality" page is accessible from the sidebar navigation
- [x] Each classified comment displays: reviewer name, comment body (truncated with expand), category badge (color-coded), confidence score, PR title/link
- [x] Comments can be filtered by: category, reviewer (team member), date range, confidence threshold
- [x] Comments can be sorted by: date, confidence, category
- [x] A summary bar at the top shows the category distribution as a horizontal stacked bar chart
- [x] Unclassified comments are visually distinct (grayed out or labeled "Pending")
- [x] Clicking a comment opens the full context: comment body, file path, PR link, classification reasoning

## Plan and implementation details

### Implementation notes

**Schema change:** Added nullable `reasoning` column to `comment_classifications` table to persist the LLM's classification reasoning (previously parsed but discarded). Migration `0005_ancient_bromley.sql` adds the column.

**Architecture (6 layers):**

1. **Schema** (`src/db/schema.ts`) — `reasoning TEXT` nullable column on `commentClassifications`
2. **Category config** (`src/lib/category-colors.ts`) — Color/label mapping for 8 classification categories
3. **DAL** (`src/db/comment-classifications.ts`) — Two new queries:
   - `getClassifiedComments(filters, sort)` — UNION of review_comments + pr_comments with LEFT JOIN on classifications, dynamic filtering and JS-side sorting
   - `getCategoryDistribution()` — GROUP BY category counts + unclassified count
4. **API routes**:
   - `GET /api/review-quality/comments` — Filters (category, reviewer, dateRange, minConfidence) + sort (date/confidence/category, asc/desc)
   - `GET /api/review-quality/summary` — Category distribution
5. **Frontend** (`src/app/review-quality/`):
   - `page.tsx` — Server Component wrapper
   - `review-quality-content.tsx` — Client orchestrator with state + fetch
   - `summary-bar.tsx` — CSS-only horizontal stacked bar chart with tooltips
   - `filter-bar.tsx` — Category/reviewer selects, date inputs, confidence threshold
   - `comments-table.tsx` — Sortable table with color-coded category badges, truncated body with expand, PR links, opacity-50 for unclassified rows
   - `comment-detail-sheet.tsx` — Slide-in Sheet with full context (body, file path, PR link, reasoning)
6. **Sidebar** (`src/components/app-sidebar.tsx`) — "Review Quality" link with `MessageSquareText` icon

**Design decisions:**
- No charting library — CSS flexbox stacked bar (KISS)
- Two separate Drizzle queries merged in JS instead of SQL UNION (more readable)
- Sheet component for detail view (better for long content than modal)
- PR links built from `github_owner`/`github_repo` settings
- No pagination for MVP
