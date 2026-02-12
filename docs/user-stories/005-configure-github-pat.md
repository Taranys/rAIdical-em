# US-005: Configure GitHub Personal Access Token

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to enter and save my GitHub Personal Access Token (PAT) in a settings page so that the application can authenticate against the GitHub API.

## Acceptance Criteria

- [x] A `/settings` page exists with a form to enter a GitHub PAT
- [x] The settings page includes a link to [generate a classic PAT](https://github.com/settings/tokens/new?scopes=repo) with the **repo** scope (works with organization repositories), and a secondary link to [fine-grained PAT](https://github.com/settings/personal-access-tokens/new) as an alternative
- [x] The PAT is stored in the SQLite database (encrypted or obfuscated — not plain text)
- [x] A "Test connection" button validates the PAT against the GitHub API and shows success/failure feedback
- [x] The PAT can be updated or deleted at any time
- [x] If no PAT is configured, the dashboard shows a prompt directing to settings

## Dependencies

- [US-022: Database Schema](022-database-schema-phase1.md) — settings table must exist
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to settings page
