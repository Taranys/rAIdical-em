# US-2.03: Phase 2 Database Schema

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As a developer, I want the database schema extended for Phase 2 so that comment classifications, seniority profiles, and highlight data can be stored efficiently.

## Acceptance Criteria

- [ ] Drizzle ORM schema adds the following tables:
  - `comment_classifications` — links a review comment (or PR comment) to a category, confidence score, LLM model used, and classification timestamp
  - `classification_runs` — tracks batch classification jobs (started at, completed at, status, comments processed, errors, model used)
  - `seniority_profiles` — per team member, per competency dimension: dimension name, dimension family (technical | soft_skill), computed maturity level, last computed date, supporting metrics JSON
  - `highlights` — flagged comments for 1:1 prep: comment reference, highlight type (best_comment | growth_opportunity), reasoning text, team member, created date
- [ ] The `comment_classifications` table references `review_comments.id` or `pr_comments.id` via a polymorphic `comment_type` + `comment_id` pattern
- [ ] Appropriate indexes are defined for dashboard query patterns (by team member, by category, by date range)
- [ ] Migrations are generated and applied cleanly on top of Phase 1 schema
- [ ] Integration tests verify table creation and basic CRUD operations

## Dependencies

- [US-022: Database Schema Phase 1](022-database-schema-phase1.md) — Phase 1 tables must exist
