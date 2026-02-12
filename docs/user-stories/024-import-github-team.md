# US-024: Import Team Members from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to import team members from a GitHub organization or by searching GitHub usernames so that I can quickly populate my team list without adding members one by one.

## Acceptance Criteria

- [ ] The team page has an "Import from GitHub" action
- [ ] The import supports two modes:
  - Search by GitHub username — type-ahead search against the GitHub API
  - Browse organization members — list members of a GitHub organization accessible with the configured PAT
- [ ] Selected users are added to the team_members table with their display name and avatar URL fetched from GitHub
- [ ] Already-existing team members are skipped with a clear indication
- [ ] The import respects GitHub API rate limits

## Dependencies

- [US-005: Configure GitHub PAT](005-configure-github-pat.md) — a valid PAT is required to query the GitHub API
- [US-007: Add Team Member](007-add-team-member.md) — the manual add flow should exist first
- [US-022: Database Schema](022-database-schema-phase1.md) — team_members table must exist
