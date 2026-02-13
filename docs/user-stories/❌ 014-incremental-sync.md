# US-014: Incremental Sync

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want subsequent syncs to only fetch new or updated data so that syncing is fast and doesn't hit rate limits unnecessarily.

## Dependencies

- 🏗️ [US-010: Fetch Pull Requests](🏗️%20010-fetch-pull-requests.md) — a full sync must have run at least once

## Acceptance Criteria

- [ ] After the first full sync, subsequent syncs only fetch PRs updated after the last sync timestamp
- [ ] The sync uses the `since` parameter on the GitHub API where available
- [ ] Newly updated PRs have their reviews and comments re-fetched

## Plan and implementation details

_To be filled before implementation._
