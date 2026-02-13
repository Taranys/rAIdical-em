# US-2.09: Review Depth Score

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Todo

## Story

As an engineering manager, I want each team member to have a "review depth" score so that I can assess whether they tend toward surface-level or deep, architectural reviews.

## Dependencies

- ❌ [US-2.05: Batch Classify Comments](❌%20US-2.05-batch-classify-comments.md) — classified comments needed for scoring
- 🏗️ [US-2.03: Phase 2 Database Schema](🏗️%20US-2.03-phase2-database-schema.md) — seniority profiles table

## Acceptance Criteria

- [ ] A depth score (0–100) is computed per team member based on their classified review comments
- [ ] Scoring weights: architectural/design and bug/security comments score higher than nitpick/style or question/clarification
- [ ] The scoring weights are defined in code as constants (not configurable by the user for now)
- [ ] The score considers the distribution of categories, not just volume — a reviewer with 80% nitpicks and 20% bugs scores lower than one with 50% architecture and 50% bugs, even if the first has more comments
- [ ] The score is computed per-period (matching the dashboard period selector)
- [ ] Unit tests verify score computation with various category distributions

## Plan and implementation details

_To be filled before implementation._
