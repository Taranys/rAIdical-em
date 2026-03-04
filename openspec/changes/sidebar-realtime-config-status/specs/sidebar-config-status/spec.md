## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Sidebar status context provides refresh capability
The application SHALL provide a `SidebarStatusContext` React context that exposes both the current sidebar status and a `refresh` function. The `refresh` function SHALL trigger an immediate re-fetch of `GET /api/sidebar-status` and update the sidebar status state.

#### Scenario: Component calls refresh after mutation
- **WHEN** any component in the app tree calls the `refresh()` function from the sidebar status context
- **THEN** the sidebar status is re-fetched from the API and all sidebar status indicators update to reflect the latest state

#### Scenario: Refresh does not disrupt sync polling
- **WHEN** a sync is in progress (status is "running") and a component calls `refresh()`
- **THEN** the existing 2-second polling continues uninterrupted alongside the manual refresh
