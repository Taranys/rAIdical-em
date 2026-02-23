# US-2.09: Review Depth Score

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Done

## Story

As an engineering manager, I want each team member to have a "review depth" score so that I can assess whether they tend toward surface-level or deep, architectural reviews.

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — classified comments needed for scoring
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — seniority profiles table

## Acceptance Criteria

- [x] A depth score (0–100) is computed per team member based on their classified review comments
- [x] Scoring weights: architectural/design and bug/security comments score higher than nitpick/style or question/clarification
- [x] The scoring weights are defined in code as constants (not configurable by the user for now)
- [x] The score considers the distribution of categories, not just volume — a reviewer with 80% nitpicks and 20% bugs scores lower than one with 50% architecture and 50% bugs, even if the first has more comments
- [x] The score is computed per-period (matching the dashboard period selector)
- [x] Unit tests verify score computation with various category distributions

## Plan and implementation details

**Goal:** Compute a review depth score (0-100) per team member based on the distribution of their classified review comment categories. Deeper categories (architecture, security, bugs) score higher than surface-level ones (nitpick, style).

**Algorithm:** Weighted average — `score = sum(count_i * weight_i) / sum(count_i)` where weights are:
- `architecture_design`: 100, `security`: 90, `bug_correctness`: 85, `performance`: 75
- `missing_test_coverage`: 65, `readability_maintainability`: 45
- `question_clarification`: 30, `nitpick_style`: 10

**Changes:**
1. Pure scoring module (`src/lib/review-depth-score.ts`) — constants + `computeDepthScore()` function
2. DAL query (`src/db/comment-classifications.ts`) — `getCategoryDistributionByReviewer()` joining classifications with review_comments and pr_comments, filtered by period
3. API endpoint (`src/app/api/dashboard/review-depth/route.ts`) — `GET ?startDate=...&endDate=...` returning `{ data: [{ reviewer, score, totalComments, categoryBreakdown }] }`

**Key files:**

| File | Action |
|------|--------|
| `src/lib/review-depth-score.ts` | Created — scoring constants + pure function |
| `src/lib/review-depth-score.test.ts` | Created — 10 unit tests |
| `src/db/comment-classifications.ts` | Modified — added `getCategoryDistributionByReviewer()` |
| `src/db/comment-classifications.integration.test.ts` | Modified — added 6 integration tests |
| `src/app/api/dashboard/review-depth/route.ts` | Created — API endpoint |
| `src/app/api/dashboard/review-depth/route.test.ts` | Created — 3 unit tests |
