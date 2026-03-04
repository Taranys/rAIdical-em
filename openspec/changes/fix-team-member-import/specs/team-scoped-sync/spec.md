## ADDED Requirements

### Requirement: Import button triggers member import reliably
The Import button in the GitHub import sheet SHALL trigger the import flow when clicked, provided at least one user is selected. The button click SHALL result in visible feedback (loading state, progress, and results).

#### Scenario: Clicking Import with selected users triggers import
- **WHEN** an EM has selected one or more GitHub users in the import sheet and clicks the "Import" button
- **THEN** the button shows a loading/progress state, API calls are made for each selected user, and import results (success/error/skipped) are displayed

#### Scenario: Import errors are surfaced to the user
- **WHEN** the import flow encounters an unexpected error (network failure, unhandled exception)
- **THEN** the user sees an error message instead of silent failure

#### Scenario: Import button remains disabled when no users are selected
- **WHEN** no users are selected in the import sheet
- **THEN** the Import button SHALL be disabled and clicking it has no effect
