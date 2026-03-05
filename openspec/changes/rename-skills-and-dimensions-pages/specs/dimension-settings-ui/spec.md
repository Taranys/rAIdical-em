## MODIFIED Requirements

### Requirement: Sidebar navigation includes dimensions link
The settings sidebar SHALL include a "Competencies" navigation link pointing to `/settings/dimensions`.

#### Scenario: Competencies link in sidebar
- **WHEN** the EM views any settings page
- **THEN** the sidebar contains a "Competencies" link between the existing navigation items
- **WHEN** the EM clicks it
- **THEN** they are navigated to `/settings/dimensions`

## RENAMED Requirements

### Requirement: Settings page for managing seniority dimensions
- **FROM:** References to "Dimensions" page title in user-facing context
- **TO:** "Competencies" page title in user-facing context
