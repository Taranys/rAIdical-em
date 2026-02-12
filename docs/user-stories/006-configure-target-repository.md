# US-006: Configure Target GitHub Repository

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to specify the GitHub organization and repository I want to track so that the application fetches data from the correct source.

## Acceptance Criteria

- [x] The settings page has fields for GitHub owner (org or user) and repository name
- [x] The repository field is searchable — typing filters the list of repositories accessible with the configured PAT
- [x] After entering valid values and a working PAT, a "Verify" action confirms the repo exists and is accessible
- [x] Owner and repository are stored in the database
- [x] Only one org/repo pair is supported at a time (single-repo scope)

## Dependencies

- [US-005: Configure GitHub PAT](005-configure-github-pat.md) — a valid PAT is required to list/verify repositories
- [US-022: Database Schema](022-database-schema-phase1.md) — settings table must exist
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to settings page
