## Why

The dashboard currently supports a single GitHub repository, configured globally via the settings table. Engineering managers typically oversee teams that contribute to multiple repositories. Without multi-repo support, they must either run separate instances or lose visibility on cross-repo activity. Adding multi-repo support enables a unified view of team performance across the entire codebase landscape.

## What Changes

- **Add a `repositories` table** to store multiple configured repos (owner, name, PAT reference) instead of relying on single-value settings keys (`github_owner`, `github_repo`).
- **Add a `repositoryId` foreign key** to `pullRequests`, `reviews`, `reviewComments`, `prComments`, and `syncRuns` tables to track which repo each record belongs to. **BREAKING** for existing data (migration needed to backfill).
- **Update the sync flow** to support syncing multiple repos (sequentially or concurrently), each tracked independently via `syncRuns`.
- **Update the settings UI** to allow adding, removing, and listing multiple repositories instead of a single owner/repo pair.
- **Update all analytics queries** (PR counts, review stats, AI ratio, size distribution) to aggregate across all repos by default.
- **Add a repo filter** to the dashboard so users can view metrics for a specific repo or the aggregate of all repos.
- **Deprecate** the `github_owner` and `github_repo` settings keys in favor of the new `repositories` table (with a migration path).

## Capabilities

### New Capabilities
- `repository-management`: CRUD operations for managing multiple GitHub repositories (add, remove, list, verify access).
- `multi-repo-sync`: Sync pull requests and reviews from multiple repositories, with independent tracking per repo.
- `repo-filter`: Dashboard-level filter to switch between aggregate view (all repos) and per-repo view.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Database schema**: New `repositories` table; new `repositoryId` column on `pullRequests`, `reviews`, `reviewComments`, `prComments`, `syncRuns`. Migration required for existing data.
- **API routes**: `/api/settings/github-repo` replaced by `/api/repositories` (CRUD). `/api/sync` updated to handle multiple repos. All analytics endpoints gain an optional `repositoryId` query parameter.
- **UI components**: Settings page repo form reworked to multi-repo list. Dashboard gains a repo selector dropdown. Sync page shows per-repo sync status.
- **GitHub API**: No change to Octokit usage, but sync logic invoked per-repo.
