# US-2.15: Classification Run History

**Phase:** 2 — Review Quality Analysis
**Epic:** E — Operations & Observability
**Status:** Done

## Story

As an engineering manager, I want to view the history of classification runs so that I can monitor LLM usage, costs, and error rates.

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — classification runs must be recorded
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — classification_runs table

## Acceptance Criteria

- [x] A "Classification History" section is available on the Review Quality page (or Settings > AI/LLM)
- [x] Each run displays: start time, duration, status (running/success/error), comments processed, model used, error count
- [x] Failed runs show the error message and allow re-running
- [x] A running total of LLM API calls and estimated token usage is tracked per run
- [x] The list is paginated (most recent first)

## Plan and implementation details

### Implementation plan

Add a "Classification Run History" section at the bottom of the existing Review Quality page. A client component fetches runs from a new API route and displays them in a paginated table with expandable error details.

### Key files

- `src/app/review-quality/classification-run-history.tsx` — Client component: paginated table (10 per page) showing start time, duration, status badge, model, processed count, and errors with expandable detail rows
- `src/app/api/review-quality/classification-runs/route.ts` — API route calling `getClassificationRunHistory(100)` from the DB layer
- `src/app/review-quality/review-quality-content.tsx` — Integration: added `ClassificationRunHistory` component inside a Card at the bottom of the page (anchor `#classification-history`)

### Implementation notes

- Duration is computed client-side from `startedAt` and `completedAt` timestamps, formatted as `Xs` or `Xm Ys`.
- Status badges use shadcn Badge variants: `default` for success, `secondary` for running, `destructive` for error.
- Error rows expand inline via a chevron toggle button, showing error count summary in a muted panel.
- Client-side pagination with `PAGE_SIZE = 10`, showing page controls (Previous/Next) only when needed.
- The API fetches up to 100 most recent runs, sorted by recency (handled by the DB query).
