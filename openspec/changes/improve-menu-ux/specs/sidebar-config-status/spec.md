## ADDED Requirements

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
The sidebar status indicators SHALL refresh when the user navigates between pages, ensuring they reflect the latest configuration state.

#### Scenario: User configures team then navigates back
- **WHEN** the user adds a team member on the Team page and then navigates to another page
- **THEN** the Team sidebar item indicator updates to show the green check icon

### Requirement: Polling for sync status
The sidebar SHALL poll `/api/sidebar-status` every 2 seconds when a sync is in progress (`sync.status` is `"running"`), and stop polling when the sync completes.

#### Scenario: Sync starts running
- **WHEN** a sync run begins (status changes to "running")
- **THEN** the sidebar begins polling every 2 seconds

#### Scenario: Sync completes
- **WHEN** a running sync completes (status changes to "success" or "error")
- **THEN** the sidebar stops polling and displays the final status icon
