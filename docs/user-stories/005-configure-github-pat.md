# US-005: Configure GitHub Personal Access Token

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to enter and save my GitHub Personal Access Token (PAT) in a settings page so that the application can authenticate against the GitHub API.

## Acceptance Criteria

- [ ] A `/settings` page exists with a form to enter a GitHub PAT
- [ ] The PAT is stored in the SQLite database (encrypted or obfuscated — not plain text)
- [ ] A "Test connection" button validates the PAT against the GitHub API and shows success/failure feedback
- [ ] The PAT can be updated or deleted at any time
- [ ] If no PAT is configured, the dashboard shows a prompt directing to settings
