# US-2.13: Detect Growth Opportunities

**Phase:** 2 — Review Quality Analysis
**Epic:** D — Highlight Reel & 1:1 Preparation
**Status:** Todo

## Story

As an engineering manager, I want the system to identify review comments where a team member could have gone deeper so that I can discuss concrete growth opportunities during 1:1s (Radical Candor: challenge directly).

## Acceptance Criteria

- [ ] An LLM-based analysis identifies "growth opportunity" comments per team member per period
- [ ] Detection criteria: comments classified as nitpick/style or question/clarification on PRs that had bug/security issues caught by other reviewers, or comments with low depth on complex files
- [ ] The prompt asks the LLM to evaluate a batch of the team member's lower-depth comments in context and suggest what a stronger review would have looked like
- [ ] Each growth opportunity includes: the original comment, the context (PR, file), and a concrete suggestion for improvement
- [ ] Selected opportunities are stored in the `highlights` table with type `growth_opportunity`, the comment reference, and the LLM's suggestion
- [ ] Opportunities are generated per classification run (or on-demand)
- [ ] Unit tests verify detection logic and storage

## Dependencies

- [US-2.05: Batch Classify Comments](US-2.05-batch-classify-comments.md) — comments must be classified first
- [US-2.03: Phase 2 Database Schema](US-2.03-phase2-database-schema.md) — highlights table
- [US-2.02: LLM Abstraction Layer](US-2.02-llm-abstraction-layer.md) — LLM service for evaluation
