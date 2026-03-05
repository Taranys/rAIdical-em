## ADDED Requirements

### Requirement: GitHub PAT card displays green background when configured
The GitHub PAT settings card SHALL display a light green background and green-tinted border when a valid GitHub Personal Access Token is saved.

#### Scenario: PAT is configured
- **WHEN** a GitHub PAT is saved and the card loads
- **THEN** the GitHub PAT card SHALL have a green background (`bg-green-50 dark:bg-green-950/30`) and green border (`border-green-200 dark:border-green-800`)

#### Scenario: PAT is saved during the session
- **WHEN** the user saves a new GitHub PAT successfully
- **THEN** the card background SHALL change from orange to green immediately without page reload

### Requirement: GitHub PAT card displays orange background when not configured
The GitHub PAT settings card SHALL display a light orange background and orange-tinted border when no GitHub PAT is configured.

#### Scenario: No PAT configured
- **WHEN** no GitHub PAT has been saved
- **THEN** the GitHub PAT card SHALL have an orange background (`bg-orange-50 dark:bg-orange-950/30`) and orange border (`border-orange-200 dark:border-orange-800`)

#### Scenario: PAT is deleted during the session
- **WHEN** the user deletes their GitHub PAT
- **THEN** the card background SHALL change from green to orange immediately without page reload

### Requirement: Repositories card displays green background when at least one repository exists
The Repositories settings card SHALL display a light green background and green-tinted border when at least one repository is configured.

#### Scenario: One or more repositories configured
- **WHEN** the repository list contains at least one repository
- **THEN** the Repositories card SHALL have a green background and green border

#### Scenario: Repository is added during the session
- **WHEN** the user adds a new repository and it is the first one
- **THEN** the card background SHALL change from orange to green

### Requirement: Repositories card displays orange background when no repositories exist
The Repositories settings card SHALL display a light orange background and orange-tinted border when no repositories are configured.

#### Scenario: No repositories configured
- **WHEN** the repository list is empty
- **THEN** the Repositories card SHALL have an orange background and orange border

#### Scenario: Last repository is removed during the session
- **WHEN** the user removes the last remaining repository
- **THEN** the card background SHALL change from green to orange

### Requirement: LLM Provider card displays green background when configured
The LLM Provider settings card SHALL display a light green background and green-tinted border when an LLM provider, model, and API key are all configured.

#### Scenario: LLM fully configured
- **WHEN** an LLM provider, model, and API key are all saved
- **THEN** the LLM Provider card SHALL have a green background and green border

#### Scenario: LLM configuration is saved during the session
- **WHEN** the user saves a complete LLM configuration
- **THEN** the card background SHALL change from orange to green immediately

### Requirement: LLM Provider card displays orange background when not configured
The LLM Provider settings card SHALL display a light orange background and orange-tinted border when the LLM provider configuration is incomplete.

#### Scenario: No LLM configuration
- **WHEN** no LLM provider has been configured
- **THEN** the LLM Provider card SHALL have an orange background and orange border

#### Scenario: LLM configuration is deleted during the session
- **WHEN** the user deletes their LLM configuration
- **THEN** the card background SHALL change from green to orange immediately

### Requirement: Action cards remain neutral
The Database Import and Database Reset cards SHALL NOT display status-colored backgrounds. They SHALL retain the default card styling.

#### Scenario: Database Import card appearance
- **WHEN** the settings page loads
- **THEN** the Database Import card SHALL have the default `bg-card` background regardless of any configuration state

#### Scenario: Database Reset card appearance
- **WHEN** the settings page loads
- **THEN** the Database Reset card SHALL have the default `bg-card` background regardless of any configuration state

### Requirement: Status colors support dark mode
All status-colored card backgrounds and borders SHALL provide appropriate dark mode variants that maintain visual distinction without being too bright.

#### Scenario: Dark mode green card
- **WHEN** a configured card is viewed in dark mode
- **THEN** the card SHALL display `bg-green-950/30` background and `border-green-800` border

#### Scenario: Dark mode orange card
- **WHEN** a needs-data card is viewed in dark mode
- **THEN** the card SHALL display `bg-orange-950/30` background and `border-orange-800` border
