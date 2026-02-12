# US-012: Fetch PR Review Comments from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want the application to fetch all review comments from pull requests so that review content is available for future categorization (Phase 2).

## Acceptance Criteria

- [ ] During sync, for each PR, the app fetches review comments (line-level comments) via the GitHub API
- [ ] Stored data: comment ID, PR number, reviewer username, body (raw text), file path, line number, created date, updated date
- [ ] General PR comments (non-review, issue-style comments) are also fetched and stored separately
- [ ] Comments are upserted on re-sync

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — PRs must be fetched first so comments can be linked to them
