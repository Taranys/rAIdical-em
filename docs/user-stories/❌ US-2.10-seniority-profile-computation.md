# US-2.10: Seniority Profile Computation

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Todo

## Story

As an engineering manager, I want the system to derive a multi-dimensional competency profile for each team member based on their review behavior so that I can understand their strengths and growth areas across technical domains and soft skills.

## Dependencies

- 🏗️ [US-2.09: Review Depth Score](🏗️%20US-2.09-review-depth-score.md) — depth score must be available
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — seniority_profiles table
- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM needed for soft skill inference

## Acceptance Criteria

- [ ] A competency profile is computed per team member, grouped by **competency dimension** (not just programming language)
- [ ] Competency dimensions are organized in two families:
  - **Technical domains**: programming languages (detected from `file_path`), security, infrastructure/ops, performance, testing, architecture/design
  - **Soft skills**: pedagogy (quality of explanations in comments), cross-team awareness (understanding global impacts and challenges of other teams), boldness (willingness to challenge code, even from senior authors), thoroughness (depth and consistency of reviews)
- [ ] Technical domains are detected automatically from review comment context (file path, category, PR metadata)
- [ ] Soft skills are inferred by the LLM during classification or via a dedicated prompt that evaluates a batch of a member's comments
- [ ] The profile aggregates the following signals per dimension:
  - Review depth score (from US-2.09)
  - Volume of reviews (total comments in the period)
  - Ratio of high-value categories (bug, security, architecture) vs. low-value (nitpick, question)
  - Consistency: standard deviation of depth score across reviews (lower = more consistent)
- [ ] A maturity level is derived per dimension: `beginner`, `intermediate`, `advanced`, `expert` — based on configurable thresholds on the aggregated signals
- [ ] Profiles are stored in the `seniority_profiles` table with the computed level, dimension, dimension family (technical/soft_skill), metrics JSON, and last-computed timestamp
- [ ] Profiles are recomputed when new classifications are available (triggered after classification runs)
- [ ] Unit tests verify level derivation with various input combinations

## Plan and implementation details

_To be filled before implementation._
