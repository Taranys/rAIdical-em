### Requirement: Owner field autocomplete
The Add Repository form SHALL display a searchable dropdown for the Owner field that suggests GitHub organizations and users accessible via the configured PAT. The suggestions SHALL be loaded from `/api/settings/github-owners` when the component mounts and a PAT is configured. The dropdown SHALL filter suggestions client-side as the user types. The user SHALL be able to select an owner from the dropdown or type a custom value.

#### Scenario: Owner suggestions displayed on focus
- **WHEN** a PAT is configured and the user focuses the Owner field
- **THEN** the system displays all available owners (organizations and users) in a dropdown

#### Scenario: Owner suggestions filtered by input
- **WHEN** the user types "doc" in the Owner field
- **THEN** the dropdown filters to show only owners whose login contains "doc" (case-insensitive)

#### Scenario: Owner selected from dropdown
- **WHEN** the user clicks an owner in the dropdown
- **THEN** the Owner field is populated with the selected owner's login and the dropdown closes

#### Scenario: Custom owner typed manually
- **WHEN** the user types "my-custom-org" without selecting from the dropdown
- **THEN** the typed value is accepted as the owner (autocomplete is a suggestion, not a constraint)

### Requirement: Repository field autocomplete
The Add Repository form SHALL display a searchable dropdown for the Repository field that searches repositories under the selected owner via the GitHub API. The search SHALL be performed server-side through `/api/settings/github-repos` with a 300ms debounce. Each suggestion SHALL display the repository name, a "Private" badge if applicable, and the description if available. The Repository field SHALL be disabled until an owner is provided.

#### Scenario: Repository search on input
- **WHEN** the user has entered an owner and types "front" in the Repository field
- **THEN** the system searches for repositories matching "front" under the selected owner and displays results in a dropdown after a 300ms debounce

#### Scenario: Repository suggestions show metadata
- **WHEN** repository search results are displayed
- **THEN** each suggestion shows the repository name, a "Private" badge if the repo is private, and the description if one exists

#### Scenario: Repository selected from dropdown
- **WHEN** the user clicks a repository in the dropdown
- **THEN** the Repository field is populated with the selected repo name and the dropdown closes

#### Scenario: Repository field disabled without owner
- **WHEN** the Owner field is empty
- **THEN** the Repository field is disabled and cannot be interacted with

#### Scenario: Loading indicator during search
- **WHEN** a repository search is in progress
- **THEN** a loading indicator is displayed to the user

### Requirement: Owner change clears repository
The system SHALL clear the Repository field value and repository suggestions when the Owner field value changes, since repositories are scoped to a specific owner.

#### Scenario: Owner changed after repo selected
- **WHEN** the user has selected owner "org-a" and repo "frontend", then changes the owner to "org-b"
- **THEN** the Repository field is cleared and previous repository suggestions are removed
