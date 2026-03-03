## ADDED Requirements

### Requirement: Sync all repositories
The system SHALL provide a "Sync All" action that triggers a sequential sync for every configured repository. Each repository sync SHALL create its own `syncRun` record with the `repositoryId` set.

#### Scenario: Sync all with multiple repositories configured
- **WHEN** the user triggers "Sync All"
- **AND** repositories "acme/frontend" and "acme/api" are configured
- **THEN** the system syncs "acme/frontend" first, then "acme/api", creating a separate syncRun for each

#### Scenario: Sync all with no repositories configured
- **WHEN** the user triggers "Sync All"
- **AND** no repositories are configured
- **THEN** the system returns an error indicating no repositories are configured

### Requirement: Sync a single repository
The system SHALL allow syncing a specific repository by passing `repositoryId` to the sync endpoint (`POST /api/sync?repositoryId=<id>`). The sync SHALL use the repository's owner/name from the `repositories` table and the global GitHub PAT.

#### Scenario: Sync a specific repository
- **WHEN** the user triggers sync for repositoryId 2
- **THEN** the system fetches PRs/reviews/comments for that repository only and stores them with `repositoryId` = 2

#### Scenario: Sync a non-existent repository
- **WHEN** the user triggers sync for repositoryId 999
- **AND** no repository with id 999 exists
- **THEN** the system returns HTTP 404

### Requirement: Associate synced data with repository
The system SHALL set the `repositoryId` column on all `pullRequests`, `reviews`, `reviewComments`, `prComments`, and `syncRuns` records created during a sync to the repository being synced.

#### Scenario: PR created during sync gets repositoryId
- **WHEN** a pull request is synced from repository with id 1
- **THEN** the PR record in the database has `repositoryId` = 1

#### Scenario: Review and comments get repositoryId from parent PR's repo
- **WHEN** reviews and comments are synced for a PR belonging to repository 1
- **THEN** all review and comment records have `repositoryId` = 1

### Requirement: Sync progress per repository
The sync UI SHALL display sync status and progress per repository, showing which repository is currently syncing and the individual progress of each sync run.

#### Scenario: Display sync progress during multi-repo sync
- **WHEN** a "Sync All" is in progress
- **AND** "acme/frontend" has completed and "acme/api" is running
- **THEN** the UI shows "acme/frontend" as completed and "acme/api" as in progress with its PR/review/comment counts

### Requirement: Incremental sync per repository
Each repository SHALL track its last successful sync independently. When syncing, the system SHALL use the last successful sync timestamp for that specific repository (not a global timestamp) to fetch only new data.

#### Scenario: Incremental sync uses per-repo timestamp
- **WHEN** "acme/frontend" was last synced on 2026-01-15
- **AND** "acme/api" was last synced on 2026-02-01
- **AND** the user triggers "Sync All"
- **THEN** "acme/frontend" syncs PRs created since 2026-01-15 and "acme/api" syncs PRs created since 2026-02-01
