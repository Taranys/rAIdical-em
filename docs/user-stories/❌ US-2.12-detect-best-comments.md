# US-2.12: Detect Best Comments (Highlights)

**Phase:** 2 — Review Quality Analysis
**Epic:** D — Highlight Reel & 1:1 Preparation
**Status:** Todo

## Story

As an engineering manager, I want the system to automatically surface the best review comments from each team member so that I can celebrate and reinforce strong review behavior during 1:1s (Radical Candor: praise specifically).

## Dependencies

- ❌ [US-2.05: Batch Classify Comments](❌%20US-2.05-batch-classify-comments.md) — comments must be classified first
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — highlights table
- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM service for evaluation

## Acceptance Criteria

- [ ] An LLM-based analysis identifies "best comments" per team member per period
- [ ] Selection criteria: high-value category (bug, security, architecture), high confidence, well-articulated reasoning in the comment body
- [ ] The prompt asks the LLM to evaluate a batch of a team member's top-classified comments and select the top 3–5 with a short justification for each
- [ ] Selected highlights are stored in the `highlights` table with type `best_comment`, the comment reference, and the LLM's reasoning
- [ ] Highlights are generated per classification run (or on-demand)
- [ ] Unit tests verify highlight selection logic and storage

## Plan and implementation details

_To be filled before implementation._
