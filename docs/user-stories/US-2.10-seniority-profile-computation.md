# US-2.10: Seniority Profile Computation

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Todo

## Story

As an engineering manager, I want the system to derive a seniority profile for each team member based on their review behavior so that I can understand their strengths and growth areas per language.

## Acceptance Criteria

- [ ] A seniority profile is computed per team member, grouped by programming language (detected from the `file_path` of review comments)
- [ ] The profile aggregates the following signals:
  - Review depth score (from US-2.09)
  - Volume of reviews (total comments in the period)
  - Ratio of high-value categories (bug, security, architecture) vs. low-value (nitpick, question)
  - Consistency: standard deviation of depth score across reviews (lower = more consistent)
- [ ] A seniority level is derived: `junior`, `mid`, `senior`, `staff` — based on configurable thresholds on the aggregated signals
- [ ] Profiles are stored in the `seniority_profiles` table with the computed level, metrics JSON, and last-computed timestamp
- [ ] Profiles are recomputed when new classifications are available (triggered after classification runs)
- [ ] Unit tests verify level derivation with various input combinations

## Dependencies

- [US-2.09: Review Depth Score](US-2.09-review-depth-score.md) — depth score must be available
- [US-2.03: Phase 2 Database Schema](US-2.03-phase2-database-schema.md) — seniority_profiles table
