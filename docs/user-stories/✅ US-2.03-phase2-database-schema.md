# US-2.03: Phase 2 Database Schema

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As a developer, I want the database schema extended for Phase 2 so that comment classifications, seniority profiles, and highlight data can be stored efficiently.

## Dependencies

- ✅ [US-022: Database Schema Phase 1](✅%20022-database-schema-phase1.md) — Phase 1 tables must exist

## Acceptance Criteria

- [x] Drizzle ORM schema adds the following tables:
  - `comment_classifications` — links a review comment (or PR comment) to a category, confidence score, LLM model used, and classification timestamp
  - `classification_runs` — tracks batch classification jobs (started at, completed at, status, comments processed, errors, model used)
  - `seniority_profiles` — per team member, per competency dimension: dimension name, dimension family (technical | soft_skill), computed maturity level, last computed date, supporting metrics JSON
  - `highlights` — flagged comments for 1:1 prep: comment reference, highlight type (best_comment | growth_opportunity), reasoning text, team member, created date
- [x] The `comment_classifications` table references `review_comments.id` or `pr_comments.id` via a polymorphic `comment_type` + `comment_id` pattern
- [x] Appropriate indexes are defined for dashboard query patterns (by team member, by category, by date range)
- [x] Migrations are generated and applied cleanly on top of Phase 1 schema
- [x] Integration tests verify table creation and basic CRUD operations

## Plan and implementation details

### Plan

4 new tables added to `src/db/schema.ts`:

1. **`classification_runs`** — tracks batch classification jobs with status, model used, comment count, and error count.
2. **`comment_classifications`** — polymorphic pattern (`comment_type` enum text + `comment_id`) links to either `review_comments` or `pr_comments`. Stores category, confidence (0-100 integer), model used, and FK to `classification_runs`.
3. **`seniority_profiles`** — per team member x dimension. Maturity levels: `junior` (not yet autonomous), `experienced` (understands impacts), `senior` (can mentor and think long-term). Families: `technical` | `soft_skill`. Supporting metrics stored as JSON text.
4. **`highlights`** — same polymorphic comment reference pattern. Types: `best_comment` | `growth_opportunity`. FK to `team_members`.

### Indexes

- `comment_classifications`: composite (comment_type, comment_id), category, classification_run_id
- `seniority_profiles`: team_member_id, composite (dimension_family, dimension_name)
- `highlights`: team_member_id, highlight_type, composite (comment_type, comment_id)
- `classification_runs`: status

### Implementation notes

- Migration `0004_cheerful_post.sql` generated cleanly on top of Phase 1 + color migration (0003).
- 8 new integration tests added to `schema.integration.test.ts` covering CRUD and FK enforcement.
- Total tables: 11 (7 Phase 1 + 4 Phase 2). All 477 tests pass.
