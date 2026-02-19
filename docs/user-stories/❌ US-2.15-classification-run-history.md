# US-2.15: Classification Run History

**Phase:** 2 — Review Quality Analysis
**Epic:** E — Operations & Observability
**Status:** Todo

## Story

As an engineering manager, I want to view the history of classification runs so that I can monitor LLM usage, costs, and error rates.

## Dependencies

- ❌ [US-2.05: Batch Classify Comments](❌%20US-2.05-batch-classify-comments.md) — classification runs must be recorded
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — classification_runs table

## Acceptance Criteria

- [ ] A "Classification History" section is available on the Review Quality page (or Settings > AI/LLM)
- [ ] Each run displays: start time, duration, status (running/success/error), comments processed, model used, error count
- [ ] Failed runs show the error message and allow re-running
- [ ] A running total of LLM API calls and estimated token usage is tracked per run
- [ ] The list is paginated (most recent first)

## Plan and implementation details

_To be filled before implementation._
