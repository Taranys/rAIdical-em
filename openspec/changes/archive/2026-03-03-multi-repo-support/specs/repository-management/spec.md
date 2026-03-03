## ADDED Requirements

### Requirement: Repository data model
The system SHALL store repositories in a dedicated `repositories` table with columns: `id` (PK, auto-increment), `owner` (text, not null), `name` (text, not null), `addedAt` (text, not null). The combination of `owner` + `name` SHALL be unique.

#### Scenario: Repository table schema
- **WHEN** the database is initialized or migrated
- **THEN** a `repositories` table exists with columns `id`, `owner`, `name`, `addedAt` and a unique constraint on (`owner`, `name`)

### Requirement: Add a repository
The system SHALL provide an API endpoint `POST /api/repositories` that accepts `{ owner: string, name: string }` and creates a new repository record. The system SHALL verify that the configured GitHub PAT has access to the repository before saving. The system SHALL return 409 if the repository already exists.

#### Scenario: Successfully add a new repository
- **WHEN** the user submits owner "acme" and name "frontend"
- **AND** the GitHub PAT has access to acme/frontend
- **THEN** the system creates a repository record and returns it with HTTP 201

#### Scenario: Add a duplicate repository
- **WHEN** the user submits owner "acme" and name "frontend"
- **AND** acme/frontend is already configured
- **THEN** the system returns HTTP 409 with an error message

#### Scenario: Add a repository without PAT access
- **WHEN** the user submits owner "acme" and name "secret-repo"
- **AND** the GitHub PAT does not have access to acme/secret-repo
- **THEN** the system returns HTTP 403 with an error message

### Requirement: List repositories
The system SHALL provide an API endpoint `GET /api/repositories` that returns all configured repositories sorted by `addedAt` ascending.

#### Scenario: List all configured repositories
- **WHEN** the user requests the repository list
- **THEN** the system returns all repositories with their `id`, `owner`, `name`, and `addedAt` fields

#### Scenario: List repositories when none configured
- **WHEN** the user requests the repository list
- **AND** no repositories are configured
- **THEN** the system returns an empty array

### Requirement: Remove a repository
The system SHALL provide an API endpoint `DELETE /api/repositories/:id` that removes a repository and all its associated data (PRs, reviews, comments, sync runs). The system SHALL return 404 if the repository does not exist.

#### Scenario: Remove a repository with associated data
- **WHEN** the user deletes repository with id 1
- **AND** there are PRs, reviews, and comments linked to repository 1
- **THEN** the system deletes the repository and all linked data, returning HTTP 200

#### Scenario: Remove a non-existent repository
- **WHEN** the user deletes repository with id 999
- **AND** no repository with id 999 exists
- **THEN** the system returns HTTP 404

### Requirement: Repository management UI
The system SHALL provide a settings UI that displays configured repositories as a list, allows adding new repositories (owner/name input with verification), and allows removing repositories with a confirmation dialog.

#### Scenario: Add a repository via the UI
- **WHEN** the user enters an owner and repository name in the settings form and clicks "Add"
- **THEN** the system verifies access, adds the repository, and displays it in the list

#### Scenario: Remove a repository via the UI
- **WHEN** the user clicks the remove button next to a repository
- **AND** confirms the deletion in the dialog
- **THEN** the system removes the repository and updates the list

### Requirement: Data model migration
The system SHALL add a nullable `repositoryId` column (foreign key to `repositories.id`) to `pullRequests`, `reviews`, `reviewComments`, `prComments`, and `syncRuns` tables. A migration script SHALL backfill existing data by reading the current `github_owner` and `github_repo` settings, creating the corresponding repository record, and setting `repositoryId` on all existing rows.

#### Scenario: Migration with existing data and configured repo
- **WHEN** the migration runs
- **AND** settings contain `github_owner` = "acme" and `github_repo` = "api"
- **THEN** a repository record for acme/api is created and all existing PR/review/comment/sync rows get `repositoryId` set to that record's id

#### Scenario: Migration with no configured repo
- **WHEN** the migration runs
- **AND** no `github_owner` or `github_repo` settings exist
- **THEN** the `repositories` table is created but no backfill occurs, and existing rows keep `repositoryId` as null
