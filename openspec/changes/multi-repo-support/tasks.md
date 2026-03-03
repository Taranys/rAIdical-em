## 1. Database Schema & Migration

- [ ] 1.1 Add `repositories` table to Drizzle schema (`id`, `owner`, `name`, `addedAt`, unique constraint on `owner`+`name`)
- [ ] 1.2 Add nullable `repositoryId` FK column to `pullRequests`, `reviews`, `reviewComments`, `prComments`, and `syncRuns` tables in the schema
- [ ] 1.3 Add index on `repositoryId` for each modified table
- [ ] 1.4 Generate and run Drizzle migration for the new table and columns
- [ ] 1.5 Write migration script that reads `github_owner`/`github_repo` settings, creates the repo record, and backfills `repositoryId` on all existing rows
- [ ] 1.6 Write unit tests for the migration logic (backfill with existing repo, no repo configured)

## 2. Repository Management API

- [ ] 2.1 Create `src/db/repositories.ts` data access layer (create, list, findById, delete with cascade)
- [ ] 2.2 Create `POST /api/repositories` route (validate input, verify GitHub access via Octokit, create record, return 201/409/403)
- [ ] 2.3 Create `GET /api/repositories` route (return all repos sorted by addedAt)
- [ ] 2.4 Create `DELETE /api/repositories/:id` route (cascade delete linked data, return 200/404)
- [ ] 2.5 Write unit tests for repositories data access layer
- [ ] 2.6 Write integration tests for repository API routes

## 3. Repository Management UI

- [ ] 3.1 Create `RepositoryList` component displaying configured repos with remove button
- [ ] 3.2 Create `AddRepositoryForm` component (owner/name inputs, verify + add flow)
- [ ] 3.3 Integrate repository management into the settings page (replace single repo form)
- [ ] 3.4 Add confirmation dialog for repository removal
- [ ] 3.5 Write unit tests for repository UI components

## 4. Sync Flow Updates

- [ ] 4.1 Update `syncPullRequests` to accept and propagate `repositoryId` to all upsert calls
- [ ] 4.2 Update `upsertPullRequest`, `upsertReview`, `upsertReviewComment`, `upsertPrComment` to include `repositoryId` field
- [ ] 4.3 Update `POST /api/sync` route to support `repositoryId` param (single repo) and "sync all" (no param)
- [ ] 4.4 Implement sequential "Sync All" logic: iterate over all repos, create one syncRun per repo
- [ ] 4.5 Update `getLatestSuccessfulSyncRun` to filter by `repositoryId` for per-repo incremental sync
- [ ] 4.6 Write unit tests for updated sync logic (single repo, sync all, incremental per repo)

## 5. Sync UI Updates

- [ ] 5.1 Update sync page to display per-repo sync status and progress
- [ ] 5.2 Add "Sync All" button and individual per-repo sync buttons
- [ ] 5.3 Update sync history to show repository name on each sync run entry
- [ ] 5.4 Write unit tests for sync UI components

## 6. Analytics Query Updates

- [ ] 6.1 Add optional `repositoryId` filter to `getPRsMergedByMember`, `getPRsOpenedByMember`, `getPRsMergedPerWeek`, `getPRsOpenedPerWeek`
- [ ] 6.2 Add optional `repositoryId` filter to `getMedianPRSizeByMember`, `getPRsByMember`
- [ ] 6.3 Add optional `repositoryId` filter to `getAiRatioByMember`, `getAiRatioTeamTotal`, `getPRDetailsByAuthor`
- [ ] 6.4 Add optional `repositoryId` filter to review and comment query functions
- [ ] 6.5 Update all analytics API routes to read `repositoryId` from query params and pass to query functions
- [ ] 6.6 Write unit tests for filtered analytics queries (with repo, without repo, invalid repo)

## 7. App-Level Repo Filter UI

- [ ] 7.1 Create `RepoSelector` dropdown component (lists repos + "All repositories" option)
- [ ] 7.2 Integrate `RepoSelector` into root layout header (`src/app/layout.tsx`), next to `SidebarTrigger`, persisting selection as `repo` URL query param
- [ ] 7.3 Update sidebar navigation links to preserve the `repo` query param when navigating between pages
- [ ] 7.4 Pass selected `repositoryId` from URL to all page-level components and API calls (dashboard, sync, review quality, team profiles)
- [ ] 7.5 Write unit tests for `RepoSelector` and cross-page filter propagation

## 8. Cleanup & Deprecation

- [ ] 8.1 Deprecate `github_owner` and `github_repo` settings keys (keep readable but stop writing)
- [ ] 8.2 Update existing settings API to redirect/inform about new repository management
- [ ] 8.3 Run full test suite and fix any regressions
- [ ] 8.4 Update user stories documentation for multi-repo support
