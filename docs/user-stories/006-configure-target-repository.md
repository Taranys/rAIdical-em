# US-006: Configure Target GitHub Repository

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to specify the GitHub organization and repository I want to track so that the application fetches data from the correct source.

## Acceptance Criteria

- [ ] The settings page has fields for GitHub owner (org or user) and repository name
- [ ] After entering valid values and a working PAT, a "Verify" action confirms the repo exists and is accessible
- [ ] Owner and repository are stored in the database
- [ ] Only one org/repo pair is supported at a time (single-repo scope)
