# US-013: View Sync Status and History

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see when the last sync happened and whether it succeeded so that I know if my data is up to date.

## Acceptance Criteria

- [ ] The sync page shows: last sync timestamp, sync status (success/failure/in progress), number of PRs and comments fetched
- [ ] A sync history log shows the last N sync runs with their status and counts
- [ ] During an active sync, a progress indicator is shown

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — sync must exist before its status can be displayed
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to sync page
