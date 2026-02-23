# US-2.12: Detect Best Comments (Highlights)

**Phase:** 2 — Review Quality Analysis
**Epic:** D — Highlight Reel & 1:1 Preparation
**Status:** Done

## Story

As an engineering manager, I want the system to automatically surface the best review comments from each team member so that I can celebrate and reinforce strong review behavior during 1:1s (Radical Candor: praise specifically).

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — comments must be classified first
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — highlights table
- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM service for evaluation

## Acceptance Criteria

- [x] An LLM-based analysis identifies "best comments" per team member per period
- [x] Selection criteria: high-value category (bug, security, architecture), high confidence, well-articulated reasoning in the comment body
- [x] The prompt asks the LLM to evaluate a batch of a team member's top-classified comments and select the top 3–5 with a short justification for each
- [x] Selected highlights are stored in the `highlights` table with type `best_comment`, the comment reference, and the LLM's reasoning
- [x] Highlights are generated per classification run (or on-demand)
- [x] Unit tests verify highlight selection logic and storage

## Plan and implementation details

### Implementation

- Created `src/db/highlights.ts` DAL with `insertHighlight`, `getHighlightsByTeamMember`, and `deleteAllHighlightsByType` functions following the existing DAL pattern (optional `dbInstance` parameter).
- Added `getTopClassifiedCommentsByMember` to `src/db/comment-classifications.ts` to query high-value classified comments (bug_correctness, security, architecture_design) with high confidence (≥70) per team member. Uses two separate queries (review_comments + pr_comments) merged and sorted by confidence DESC, capped at 20.
- Created `src/lib/llm/highlight-detector.ts` with `buildHighlightPrompt` (evaluates a batch of top comments and asks LLM to select top 3-5 with justification), `parseHighlightResponse` (validates JSON structure), and `isHighlightError` type guard — same pattern as `classifier.ts`.
- Created `src/lib/highlight-service.ts` with `generateBestCommentHighlights(options?)` orchestrator that: clears existing best_comment highlights, iterates over active team members, fetches their top classified comments, calls LLM for evaluation, validates commentIds (prevents hallucination), and stores results. Supports DI via `llmService` option.
- Created `POST /api/highlights/generate` API route with fire-and-forget pattern (same as `/api/classify`). Validates LLM configuration before triggering.
- Added integration tests for highlights DAL and the new `getTopClassifiedCommentsByMember` query.
- Added unit tests for highlight-detector prompt/parser (27 tests), highlight-service (9 tests), and API route (2 tests).
