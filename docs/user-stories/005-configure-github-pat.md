# US-005: Configure GitHub Personal Access Token

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to enter and save my GitHub Personal Access Token (PAT) in a settings page so that the application can authenticate against the GitHub API.

## Acceptance Criteria

- [ ] A `/settings` page exists with a form to enter a GitHub PAT
- [ ] The settings page includes a link to [generate a fine-grained PAT](https://github.com/settings/personal-access-tokens/new) with the required permissions:
  - **Pull requests**: Read — to fetch PRs, reviews, and review comments
  - **Contents**: Read — to access repository content and commit data
  - **Metadata**: Read (automatically included) — to access repository metadata
- [ ] The PAT is stored in the SQLite database (encrypted or obfuscated — not plain text)
- [ ] A "Test connection" button validates the PAT against the GitHub API and shows success/failure feedback
- [ ] The PAT can be updated or deleted at any time
- [ ] If no PAT is configured, the dashboard shows a prompt directing to settings

## Dependencies

- [US-022: Database Schema](022-database-schema-phase1.md) — settings table must exist
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to settings page
