## ADDED Requirements

### Requirement: Repository filter on analytics API
All analytics API endpoints SHALL accept an optional `repositoryId` query parameter. When provided, the endpoint SHALL return data only for that repository. When absent, the endpoint SHALL return aggregated data across all repositories.

#### Scenario: Query PR metrics for a specific repository
- **WHEN** the user requests `/api/metrics/prs-merged?repositoryId=1`
- **THEN** the system returns PR merge counts only for repository 1

#### Scenario: Query PR metrics without repository filter
- **WHEN** the user requests `/api/metrics/prs-merged` without a repositoryId parameter
- **THEN** the system returns PR merge counts aggregated across all repositories

#### Scenario: Query with invalid repositoryId
- **WHEN** the user requests `/api/metrics/prs-merged?repositoryId=999`
- **AND** no repository with id 999 exists
- **THEN** the system returns an empty result set (not an error)

### Requirement: App-level repository selector
The application root layout header SHALL display a dropdown selector that lists all configured repositories plus an "All repositories" option. The selector SHALL default to "All repositories". The selector SHALL be visible on every page of the application (dashboard, sync, review quality, team profiles, etc.). Selecting a repository SHALL filter all page content to that repository without requiring re-selection when navigating between pages.

#### Scenario: Default view shows aggregated data
- **WHEN** the user loads any page
- **THEN** the repository selector in the header shows "All repositories" and all page content displays aggregated data

#### Scenario: Select a specific repository
- **WHEN** the user selects "acme/frontend" from the repository dropdown in the header
- **THEN** all current page content refreshes to show data only for "acme/frontend"

#### Scenario: Navigate to another page with repo selected
- **WHEN** the user has selected "acme/frontend" in the repo selector
- **AND** the user navigates from the dashboard to the sync page
- **THEN** the repo selector still shows "acme/frontend" and the sync page displays data for that repository

#### Scenario: Switch back to all repositories
- **WHEN** the user selects "All repositories" from the dropdown
- **THEN** all current page content refreshes to show aggregated data across all repos

### Requirement: Repository filter persists in URL across navigation
The selected repository filter SHALL be stored as a `repo` query parameter in the URL (e.g., `?repo=1`). Absence of the parameter means "all repositories". This enables bookmarking and sharing filtered views. The `repo` query parameter SHALL be preserved when navigating between pages via the sidebar.

#### Scenario: URL reflects selected repository
- **WHEN** the user selects repository with id 2
- **THEN** the URL updates to include `?repo=2`

#### Scenario: URL without repo parameter shows all
- **WHEN** the user navigates to any page without a `repo` query parameter
- **THEN** the selector defaults to "All repositories" and content is aggregated

#### Scenario: Navigation preserves repo parameter
- **WHEN** the user has `?repo=2` in the URL
- **AND** the user clicks a sidebar link to navigate to another page
- **THEN** the `repo=2` query parameter is carried over to the new page URL

### Requirement: Repository filter on sync page
The sync page SHALL display sync history per repository. The user SHALL be able to view sync runs for a specific repository or all repositories.

#### Scenario: View sync history for a specific repository
- **WHEN** the user selects "acme/api" on the sync page
- **THEN** only sync runs for "acme/api" are displayed

#### Scenario: View sync history for all repositories
- **WHEN** the user selects "All repositories" on the sync page
- **THEN** sync runs for all repositories are displayed, with each run showing which repository it belongs to
