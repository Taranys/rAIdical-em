## ADDED Requirements

### Requirement: Reclassify button in AI ratio card
The AI ratio card SHALL display a "Reclassifier" button in its header that triggers a full GitHub sync to re-fetch commits and reclassify all PRs with the current heuristics configuration.

#### Scenario: Button triggers full sync
- **WHEN** the user clicks the "Reclassifier" button
- **THEN** the system SHALL send a `POST /api/sync` request without `sinceDate` (triggering a full sync from the beginning)

#### Scenario: Button shows loading state during sync
- **WHEN** a sync is in progress (triggered by the button)
- **THEN** the button SHALL display a loading spinner and be disabled to prevent double-clicks

#### Scenario: Data refreshes after sync completes
- **WHEN** the sync completes successfully
- **THEN** the AI ratio chart and team totals SHALL automatically refresh with the updated classification data

#### Scenario: Button disabled when sync already running
- **WHEN** a sync is already running (409 response from POST /api/sync)
- **THEN** the button SHALL remain disabled and show a message indicating a sync is already in progress

#### Scenario: Sync error displays feedback
- **WHEN** the sync fails (error response from POST /api/sync)
- **THEN** the system SHALL display an error message to the user
