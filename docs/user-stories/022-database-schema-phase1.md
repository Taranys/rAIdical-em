# US-022: Design and Implement Phase 1 Database Schema

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As a developer, I want a well-structured database schema for Phase 1 data so that data is stored efficiently and supports all dashboard queries.

## Acceptance Criteria

- [ ] Drizzle ORM schema defines the following tables:
  - `settings` — key/value store for PAT, org, repo, AI heuristic config
  - `team_members` — GitHub username, display name, avatar URL, active flag, created/updated timestamps
  - `pull_requests` — PR number, title, author, state, created/merged dates, additions, deletions, changed files, ai_classification, raw JSON (for future use)
  - `reviews` — review ID, PR number, reviewer, state, submitted date
  - `review_comments` — comment ID, PR number, reviewer, body, file path, line, created/updated dates
  - `pr_comments` — comment ID, PR number, author, body, created/updated dates
  - `sync_runs` — run ID, started at, completed at, status, PR count, comment count, error message
- [ ] Migrations are generated via `npm run db:generate` and applied via `npm run db:migrate`
- [ ] Foreign keys and indexes are defined for common query patterns

## Dependencies

None — this is the foundational story for Phase 1.
