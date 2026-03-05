### Requirement: Sidebar status API endpoint
The system SHALL expose a `GET /api/sidebar-status` endpoint that returns the configuration status of each section in the Configuration group.

The response SHALL have the shape:
```json
{
  "settings": { "configured": boolean },
  "team": { "configured": boolean },
  "sync": { "hasRun": boolean, "status": "success" | "error" | "running" | null }
}
```

- `settings.configured` SHALL be `true` only when both GitHub PAT and GitHub Repository are configured.
- `team.configured` SHALL be `true` when at least one team member exists.
- `sync.hasRun` SHALL be `true` when at least one sync run exists for the configured repository.
- `sync.status` SHALL reflect the status of the latest sync run, or `null` if no run exists.

#### Scenario: All sections are configured
- **WHEN** GitHub PAT is set, GitHub Repository is set, at least one team member exists, and a sync run exists with status "success"
- **THEN** the endpoint returns `{"settings":{"configured":true},"team":{"configured":true},"sync":{"hasRun":true,"status":"success"}}`

#### Scenario: No configuration exists
- **WHEN** no GitHub PAT is set, no team members exist, and no sync has ever run
- **THEN** the endpoint returns `{"settings":{"configured":false},"team":{"configured":false},"sync":{"hasRun":false,"status":null}}`

#### Scenario: Partial configuration
- **WHEN** GitHub PAT is set but GitHub Repository is not set
- **THEN** `settings.configured` SHALL be `false`

### Requirement: Settings item displays configuration status indicator
The "Settings" sidebar item SHALL display a status indicator icon:
- A green check icon (`CheckCircle2`) when `settings.configured` is `true`
- An amber alert icon (`AlertCircle`) when `settings.configured` is `false`

#### Scenario: Settings fully configured
- **WHEN** both GitHub PAT and GitHub Repository are configured
- **THEN** the Settings sidebar item displays a green check icon

#### Scenario: Settings not configured
- **WHEN** GitHub PAT or GitHub Repository is missing
- **THEN** the Settings sidebar item displays an amber alert icon

### Requirement: Team item displays configuration status indicator
The "Team" sidebar item SHALL display a status indicator icon:
- A green check icon (`CheckCircle2`) when `team.configured` is `true`
- An amber alert icon (`AlertCircle`) when `team.configured` is `false`

#### Scenario: Team has members
- **WHEN** at least one team member is defined
- **THEN** the Team sidebar item displays a green check icon

#### Scenario: Team has no members
- **WHEN** no team members are defined
- **THEN** the Team sidebar item displays an amber alert icon

### Requirement: Sync item displays configuration status indicator
The "Sync" sidebar item SHALL display a status indicator based on the sync state:
- A green check icon (`CheckCircle2`) when the latest sync status is `"success"`
- A red alert icon (`AlertCircle` in red) when the latest sync status is `"error"`
- A spinning loader icon (`Loader2` with animation) when the latest sync status is `"running"`
- An amber alert icon (`AlertCircle`) when no sync has ever been run (`hasRun` is `false`)

#### Scenario: Sync completed successfully
- **WHEN** the latest sync run has status "success"
- **THEN** the Sync sidebar item displays a green check icon

#### Scenario: Sync failed
- **WHEN** the latest sync run has status "error"
- **THEN** the Sync sidebar item displays a red alert icon

#### Scenario: Sync in progress
- **WHEN** a sync run is currently in progress (status "running")
- **THEN** the Sync sidebar item displays a spinning loader icon

#### Scenario: No sync has ever run
- **WHEN** no sync run exists
- **THEN** the Sync sidebar item displays an amber alert icon

### Requirement: Status indicators update on navigation
The sidebar status indicators SHALL refresh when the user navigates between pages, ensuring they reflect the latest configuration state. Additionally, the sidebar status indicators SHALL refresh immediately after any configuration mutation succeeds on any page, without requiring navigation.

#### Scenario: User configures team then navigates back
- **WHEN** the user adds a team member on the Team page and then navigates to another page
- **THEN** the Team sidebar item indicator updates to show the green check icon

#### Scenario: User saves GitHub PAT on settings page
- **WHEN** the user saves a valid GitHub PAT on the Settings page
- **THEN** the Settings sidebar item indicator updates to reflect the new configuration state without page navigation

#### Scenario: User adds a repository on settings page
- **WHEN** the user adds a repository on the Settings page
- **THEN** the Settings sidebar item indicator updates to reflect the new configuration state without page navigation

#### Scenario: User deletes GitHub PAT on settings page
- **WHEN** the user deletes the GitHub PAT on the Settings page
- **THEN** the Settings sidebar item indicator updates to show the amber alert icon without page navigation

#### Scenario: User removes all repositories on settings page
- **WHEN** the user removes the last repository on the Settings page
- **THEN** the Settings sidebar item indicator updates to reflect the unconfigured state without page navigation

#### Scenario: User saves LLM provider configuration
- **WHEN** the user saves the LLM provider, model, and API key on the Settings page
- **THEN** the Settings sidebar item indicator updates to reflect the new configuration state without page navigation

#### Scenario: User deletes LLM provider configuration
- **WHEN** the user deletes the LLM provider configuration on the Settings page
- **THEN** the Settings sidebar item indicator updates to reflect the unconfigured state without page navigation

#### Scenario: User adds a team member on team page
- **WHEN** the user adds a team member on the Team page
- **THEN** the Team sidebar item indicator updates to show the green check icon without page navigation

#### Scenario: User removes the last team member on team page
- **WHEN** the user removes the last team member on the Team page
- **THEN** the Team sidebar item indicator updates to show the amber alert icon without page navigation

### Requirement: Polling for sync status
The sidebar SHALL poll `/api/sidebar-status` every 2 seconds when a sync is in progress (`sync.status` is `"running"`), and stop polling when the sync completes.

#### Scenario: Sync starts running
- **WHEN** a sync run begins (status changes to "running")
- **THEN** the sidebar begins polling every 2 seconds

#### Scenario: Sync completes
- **WHEN** a running sync completes (status changes to "success" or "error")
- **THEN** the sidebar stops polling and displays the final status icon

### Requirement: Sidebar status context provides refresh capability
The application SHALL provide a `SidebarStatusContext` React context that exposes both the current sidebar status and a `refresh` function. The `refresh` function SHALL trigger an immediate re-fetch of `GET /api/sidebar-status` and update the sidebar status state.

#### Scenario: Component calls refresh after mutation
- **WHEN** any component in the app tree calls the `refresh()` function from the sidebar status context
- **THEN** the sidebar status is re-fetched from the API and all sidebar status indicators update to reflect the latest state

#### Scenario: Refresh does not disrupt sync polling
- **WHEN** a sync is in progress (status is "running") and a component calls `refresh()`
- **THEN** the existing 2-second polling continues uninterrupted alongside the manual refresh
