# US-011: Fetch PR Reviews from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want the application to fetch all reviews for each pull request so that I can track who reviewed what and how often.

## Acceptance Criteria

- [ ] During sync, for each PR, the app fetches reviews via the GitHub API
- [ ] Stored data: review ID, PR number, reviewer username, review state (APPROVED, CHANGES_REQUESTED, COMMENTED), submitted date
- [ ] Reviews are upserted on re-sync

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — PRs must be fetched first so reviews can be linked to them
