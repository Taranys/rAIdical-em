# US-2.16: Manually Reclassify a Comment

**Phase:** 2 — Review Quality Analysis
**Epic:** E — Operations & Observability
**Status:** Done

## Story

As an engineering manager, I want to manually override the classification of a review comment so that I can correct mistakes made by the LLM.

## Dependencies

- ✅ [US-2.07: View Classification Results](✅%20US-2.07-view-classification-results.md) — classification view must exist

## Acceptance Criteria

- [x] On the classification results view (US-2.07), each comment has an "Edit classification" action
- [x] Clicking it opens a dropdown to select a different category from the 8 available categories
- [x] The manual override is saved in `comment_classifications` with a flag indicating it was manually set
- [x] Manually classified comments are not overwritten by future batch classification runs
- [x] The override is reflected immediately in all dashboards and charts
- [x] A visual indicator (e.g., small icon) distinguishes manually classified comments from LLM-classified ones

## Plan and implementation details

### Implementation plan

1. **DB migration**: Added `is_manual` column (integer, default 0) to `comment_classifications` table
2. **Data access layer**: Added `updateClassification()` function and exposed `isManual` in `ClassifiedComment` type and `getClassifiedComments()` query
3. **API route**: Created `PUT /api/review-quality/comments/[commentType]/[commentId]/classify` endpoint
4. **UI (table)**: Added Pencil edit button next to each classified comment's category badge; clicking opens a `<Select>` dropdown with all 8 categories
5. **UI (detail sheet)**: Added category dropdown and manual indicator in the slide-in detail panel
6. **Manual indicator**: `UserPen` icon from lucide-react displayed next to manually classified comments
7. **Batch protection**: Existing `getUnclassifiedReviewComments()`/`getUnclassifiedPrComments()` already exclude classified comments via NOT IN subquery — manual overrides are never re-classified

### Implementation notes

- The `is_manual` flag uses integer (0/1) for SQLite compatibility
- Manual overrides set `confidence = 100`, `modelUsed = "manual"`, `reasoning = null`, `classificationRunId = null`
- The `handleReclassify` callback in `ReviewQualityContent` reloads both comments list and category distribution summary to reflect changes immediately
- Tests: 5 integration tests for `updateClassification`, 6 API route unit tests, 5 component tests, 4 E2E tests
