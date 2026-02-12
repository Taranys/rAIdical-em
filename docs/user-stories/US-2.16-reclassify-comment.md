# US-2.16: Manually Reclassify a Comment

**Phase:** 2 — Review Quality Analysis
**Epic:** E — Operations & Observability
**Status:** Todo

## Story

As an engineering manager, I want to manually override the classification of a review comment so that I can correct mistakes made by the LLM.

## Acceptance Criteria

- [ ] On the classification results view (US-2.07), each comment has an "Edit classification" action
- [ ] Clicking it opens a dropdown to select a different category from the 8 available categories
- [ ] The manual override is saved in `comment_classifications` with a flag indicating it was manually set
- [ ] Manually classified comments are not overwritten by future batch classification runs
- [ ] The override is reflected immediately in all dashboards and charts
- [ ] A visual indicator (e.g., small icon) distinguishes manually classified comments from LLM-classified ones

## Dependencies

- [US-2.07: View Classification Results](US-2.07-view-classification-results.md) — classification view must exist
