# US-010: Fetch Pull Requests from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want the application to fetch all pull requests from the configured repository so that PR data is available locally for metrics.

## Acceptance Criteria

- [ ] A "Sync" action (manual trigger from the UI) fetches PRs from the GitHub API via Octokit
- [ ] Fetched data includes: PR number, title, author, state (open/closed/merged), created date, merged date, additions, deletions, changed files count
- [ ] PRs are stored in the SQLite database (upserted — no duplicates on re-sync)
- [ ] The sync respects GitHub API rate limits and handles pagination
- [ ] All PRs are fetched and stored; filtering by team member happens at display time
