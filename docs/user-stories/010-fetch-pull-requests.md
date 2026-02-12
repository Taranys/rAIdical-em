# US-010: Fetch Pull Requests from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want the application to fetch all pull requests from the configured repository so that PR data is available locally for metrics.

## Acceptance Criteria

- [ ] A dedicated sync page shows the sync process with real-time progress (PRs fetched, current step, errors)
- [ ] A "Sync" action (manual trigger) fetches PRs from the GitHub API via Octokit
- [ ] Fetched data includes: PR number, title, author, state (open/closed/merged), created date, merged date, additions, deletions, changed files count
- [ ] PRs are stored in the SQLite database (upserted — no duplicates on re-sync)
- [ ] The sync respects GitHub API rate limits and handles pagination
- [ ] All PRs are fetched and stored; filtering by team member happens at display time

## Dependencies

- [US-005: Configure GitHub PAT](005-configure-github-pat.md) — a valid PAT is required to call the GitHub API
- [US-006: Configure Target Repository](006-configure-target-repository.md) — a repository must be configured to know what to fetch
- [US-022: Database Schema](022-database-schema-phase1.md) — pull_requests and sync_runs tables must exist
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to sync page
