# US-014: Incremental Sync

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want subsequent syncs to only fetch new or updated data so that syncing is fast and doesn't hit rate limits unnecessarily.

## Acceptance Criteria

- [ ] After the first full sync, subsequent syncs only fetch PRs updated after the last sync timestamp
- [ ] The sync uses the `since` parameter on the GitHub API where available
- [ ] Newly updated PRs have their reviews and comments re-fetched
