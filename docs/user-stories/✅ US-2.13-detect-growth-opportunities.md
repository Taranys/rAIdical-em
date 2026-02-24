# US-2.13: Detect Growth Opportunities

**Phase:** 2 — Review Quality Analysis
**Epic:** D — Highlight Reel & 1:1 Preparation
**Status:** Done

## Story

As an engineering manager, I want the system to identify review comments where a team member could have gone deeper so that I can discuss concrete growth opportunities during 1:1s (Radical Candor: challenge directly).

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — comments must be classified first
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — highlights table
- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM service for evaluation

## Acceptance Criteria

- [x] An LLM-based analysis identifies "growth opportunity" comments per team member per period
- [x] Detection criteria: comments classified as nitpick/style or question/clarification on PRs that had bug/security issues caught by other reviewers, or comments with low depth on complex files
- [x] The prompt asks the LLM to evaluate a batch of the team member's lower-depth comments in context and suggest what a stronger review would have looked like
- [x] Each growth opportunity includes: the original comment, the context (PR, file), and a concrete suggestion for improvement
- [x] Selected opportunities are stored in the `highlights` table with type `growth_opportunity`, the comment reference, and the LLM's suggestion
- [x] Opportunities are generated per classification run (or on-demand)
- [x] Unit tests verify detection logic and storage

## Plan and implementation details

### Architecture

Mirror of US-2.12 (best comment highlights) but inverted — instead of finding best comments, we find low-depth comments where the reviewer could have gone deeper.

**Pipeline:** `getLowDepthCommentsByMember()` → `buildGrowthOpportunityPrompt()` → LLM → `parseGrowthOpportunityResponse()` → `insertHighlight(type: "growth_opportunity")`

### Files created

- `src/lib/llm/growth-detector.ts` — Prompt builder + parser for growth opportunities (types, buildGrowthOpportunityPrompt, parseGrowthOpportunityResponse, isGrowthOpportunityError)
- `src/lib/llm/growth-detector.test.ts` — 29 unit tests for prompt/parser
- `src/lib/growth-service.ts` — Service orchestrator generateGrowthOpportunities()
- `src/lib/growth-service.test.ts` — 11 unit tests for service logic

### Files modified

- `src/db/comment-classifications.ts` — Added `getLowDepthCommentsByMember()`, `LowDepthCommentForGrowth` type, `LOW_DEPTH_CATEGORIES` const
- `src/db/comment-classifications.integration.test.ts` — 10 integration tests for new query
- `src/app/api/highlights/generate/route.ts` — Added parallel call to `generateGrowthOpportunities()`
- `src/app/api/highlights/generate/route.test.ts` — Updated with growth service mock and assertion
- `src/lib/llm/index.ts` — Added barrel exports for growth-detector

### Key design decisions

- **Two-pass SQL query:** `getLowDepthCommentsByMember` uses Query A (low-depth comments by member) + Query B (check for high-value issues from OTHER reviewers on same PRs) + JS enrichment. Simpler than complex CTEs and consistent with KISS principle.
- **minConfidence=50 default:** Lower than best_comment (70) because nitpick/question classifications tend to have lower confidence scores.
- **`suggestion` stored in `reasoning` column:** No schema migration needed — the existing `highlights.reasoning` column is generic enough.
- **Parallel generation:** Both `generateBestCommentHighlights()` and `generateGrowthOpportunities()` run in parallel via `Promise.all()` in the API route.
