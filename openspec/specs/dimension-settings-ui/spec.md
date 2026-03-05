### Requirement: Settings page for managing seniority dimensions
The system SHALL provide a settings page at `/settings/dimensions` where the EM can view, add, edit, disable, and delete seniority dimension configurations.

#### Scenario: Page displays all configured dimensions
- **WHEN** the EM navigates to `/settings/dimensions`
- **THEN** all dimension configurations (enabled and disabled) are listed in `sortOrder` order
- **THEN** each dimension row displays: label, name (slug), family badge (technical/soft_skill), enabled/disabled status, and description

#### Scenario: Disabled dimensions are visually distinguished
- **WHEN** a dimension has `isEnabled = 0`
- **THEN** its row appears with reduced opacity or a "disabled" indicator
- **THEN** it is still visible and editable

### Requirement: Add new dimension via inline form
The EM SHALL be able to create a new seniority dimension from the settings page.

#### Scenario: Creating a technical dimension
- **WHEN** the EM clicks "Add Dimension"
- **THEN** an inline form appears with fields: Label, Name (auto-generated from label), Family (dropdown: technical/soft_skill), Description (textarea)
- **WHEN** the EM selects `family = technical`
- **THEN** a "Source Categories" multi-select field appears listing available category slugs from `customCategories`
- **WHEN** the EM fills all required fields and clicks "Add"
- **THEN** the dimension is created via the API and appears in the list

#### Scenario: Creating a soft skill dimension
- **WHEN** the EM selects `family = soft_skill`
- **THEN** the "Source Categories" field is hidden
- **WHEN** the EM fills Label and Description and clicks "Add"
- **THEN** the dimension is created with `sourceCategories = null`

#### Scenario: Name auto-generation from label
- **WHEN** the EM types "Incident Response" in the Label field for a new dimension
- **THEN** the Name field is auto-populated with "incident_response"

### Requirement: Edit existing dimension
The EM SHALL be able to edit any dimension's label, description, and sourceCategories (for technical dimensions).

#### Scenario: Editing a dimension
- **WHEN** the EM clicks the edit icon on a dimension row
- **THEN** an inline edit form appears pre-filled with the dimension's current values
- **WHEN** the EM changes the description and clicks "Save"
- **THEN** the dimension is updated via the API and the list refreshes

#### Scenario: Family cannot be changed after creation
- **WHEN** the EM edits an existing dimension
- **THEN** the Family field is read-only (displayed but not editable)

### Requirement: Enable/disable dimensions
The EM SHALL be able to toggle the enabled state of any dimension.

#### Scenario: Disabling a dimension
- **WHEN** the EM toggles the enabled switch off for a dimension
- **THEN** the dimension's `isEnabled` is set to 0 via the API
- **THEN** the dimension row updates to show disabled state

#### Scenario: Re-enabling a dimension
- **WHEN** the EM toggles the enabled switch on for a disabled dimension
- **THEN** the dimension's `isEnabled` is set to 1 via the API

### Requirement: Delete dimension with confirmation
The EM SHALL be able to permanently delete a dimension after confirmation.

#### Scenario: Delete with confirmation dialog
- **WHEN** the EM clicks the delete icon on a dimension
- **THEN** a confirmation dialog appears warning that existing profile data for this dimension will become orphaned
- **WHEN** the EM confirms deletion
- **THEN** the dimension is hard-deleted via the API and removed from the list

### Requirement: Reorder dimensions
The EM SHALL be able to change the display order of dimensions using up/down buttons.

#### Scenario: Moving a dimension up
- **WHEN** the EM clicks the up arrow on the second dimension in the list
- **THEN** it swaps position with the first dimension
- **THEN** the new order is persisted via the reorder API

### Requirement: Reset to defaults action
The EM SHALL be able to reset all dimension configurations to the 8 hardcoded defaults.

#### Scenario: Reset with confirmation
- **WHEN** the EM clicks "Reset to Defaults"
- **THEN** a confirmation dialog warns that all custom dimensions will be removed
- **WHEN** the EM confirms
- **THEN** the reset API is called and the list refreshes with the 8 default dimensions

### Requirement: CRUD API for seniority dimensions
The system SHALL expose REST endpoints for dimension configuration management.

#### Scenario: GET lists all dimensions
- **WHEN** `GET /api/settings/seniority-dimensions` is called
- **THEN** it returns a JSON array of all dimension configs ordered by `sortOrder`

#### Scenario: POST creates a new dimension
- **WHEN** `POST /api/settings/seniority-dimensions` is called with a valid body
- **THEN** the dimension is created and the new row is returned with status 201

#### Scenario: POST rejects invalid family
- **WHEN** `POST /api/settings/seniority-dimensions` is called with `family = "unknown"`
- **THEN** the endpoint returns status 400 with an error message

#### Scenario: POST rejects technical dimension without sourceCategories
- **WHEN** `POST /api/settings/seniority-dimensions` is called with `family = "technical"` and no `sourceCategories`
- **THEN** the endpoint returns status 400

#### Scenario: PUT updates a dimension
- **WHEN** `PUT /api/settings/seniority-dimensions/[id]` is called with partial update fields
- **THEN** the dimension is updated and the updated row is returned

#### Scenario: DELETE removes a dimension
- **WHEN** `DELETE /api/settings/seniority-dimensions/[id]` is called
- **THEN** the dimension is permanently deleted and status 204 is returned

#### Scenario: PUT reorder updates sort order
- **WHEN** `PUT /api/settings/seniority-dimensions/reorder` is called with `{ orderedIds: [3, 1, 2] }`
- **THEN** each dimension's `sortOrder` is updated to match its position in the array

#### Scenario: POST reset restores defaults
- **WHEN** `POST /api/settings/seniority-dimensions/reset` is called
- **THEN** all custom dimensions are deleted, 8 defaults are re-inserted, and the default list is returned

### Requirement: Sidebar navigation includes competencies link
The settings sidebar SHALL include a "Competencies" navigation link pointing to `/settings/dimensions`.

#### Scenario: Competencies link in sidebar
- **WHEN** the EM views any settings page
- **THEN** the sidebar contains a "Competencies" link between the existing navigation items
- **WHEN** the EM clicks it
- **THEN** they are navigated to `/settings/dimensions`
