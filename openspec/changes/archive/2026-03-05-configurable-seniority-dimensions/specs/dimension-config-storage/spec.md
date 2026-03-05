## ADDED Requirements

### Requirement: Dimension configuration table stores user-defined dimensions
The system SHALL persist seniority dimension configurations in a `seniorityDimensionConfigs` database table with columns: `id` (primary key), `name` (unique slug), `family` ('technical' | 'soft_skill'), `label` (display name), `description` (text), `sourceCategories` (JSON array of category slugs, nullable), `isEnabled` (integer 0|1, default 1), `sortOrder` (integer), `createdAt` (ISO timestamp), `updatedAt` (ISO timestamp).

#### Scenario: Table schema matches specification
- **WHEN** the database migration for `seniorityDimensionConfigs` is applied
- **THEN** the table contains all specified columns with correct types and constraints
- **THEN** the `name` column has a unique constraint

#### Scenario: Technical dimension stores sourceCategories
- **WHEN** a technical dimension is inserted with `family = 'technical'` and `sourceCategories = '["security"]'`
- **THEN** the row is stored successfully with the JSON array in the `sourceCategories` column

#### Scenario: Soft skill dimension has null sourceCategories
- **WHEN** a soft skill dimension is inserted with `family = 'soft_skill'`
- **THEN** the `sourceCategories` column SHALL be null

### Requirement: Default dimensions are seeded on migration
The database migration SHALL insert the 8 default seniority dimensions (security, architecture, performance, testing, pedagogy, cross_team_awareness, boldness, thoroughness) with their current descriptions and source category mappings.

#### Scenario: Fresh database has all 8 defaults
- **WHEN** the migration runs on a fresh database
- **THEN** the `seniorityDimensionConfigs` table contains exactly 8 rows
- **THEN** 4 rows have `family = 'technical'` with names: security, architecture, performance, testing
- **THEN** 4 rows have `family = 'soft_skill'` with names: pedagogy, cross_team_awareness, boldness, thoroughness
- **THEN** all rows have `isEnabled = 1`

#### Scenario: Migration is idempotent
- **WHEN** the migration runs on a database that already has the table populated
- **THEN** existing rows are NOT duplicated

### Requirement: CRUD operations for dimension configurations
The data access layer SHALL provide functions to create, read, update, and delete dimension configurations.

#### Scenario: Create a new dimension
- **WHEN** `createDimensionConfig({ name: "observability", family: "technical", label: "Observability", description: "...", sourceCategories: ["performance"] })` is called
- **THEN** a new row is inserted with `isEnabled = 1` and `sortOrder` set to the next available value
- **THEN** the inserted row is returned

#### Scenario: Read all dimensions
- **WHEN** `getAllDimensionConfigs()` is called
- **THEN** all rows from `seniorityDimensionConfigs` are returned ordered by `sortOrder`

#### Scenario: Read only enabled dimensions
- **WHEN** `getEnabledDimensionConfigs()` is called
- **THEN** only rows with `isEnabled = 1` are returned ordered by `sortOrder`

#### Scenario: Update a dimension
- **WHEN** `updateDimensionConfig(id, { label: "New Label", description: "Updated" })` is called
- **THEN** the row with matching `id` is updated with the new values
- **THEN** the `updatedAt` timestamp is refreshed

#### Scenario: Delete a dimension
- **WHEN** `deleteDimensionConfig(id)` is called
- **THEN** the row with matching `id` is permanently removed

#### Scenario: Toggle dimension enabled state
- **WHEN** `updateDimensionConfig(id, { isEnabled: 0 })` is called for an enabled dimension
- **THEN** the dimension's `isEnabled` is set to 0
- **THEN** the dimension is excluded from `getEnabledDimensionConfigs()` results

#### Scenario: Reorder dimensions
- **WHEN** `reorderDimensionConfigs([3, 1, 2])` is called with an array of dimension IDs
- **THEN** each dimension's `sortOrder` is updated to match its index in the array

#### Scenario: Reset to defaults
- **WHEN** `resetDimensionConfigsToDefaults()` is called
- **THEN** all existing rows are deleted
- **THEN** the 8 default dimensions are re-inserted

### Requirement: Dimension name uniqueness is enforced
The system SHALL reject creation of a dimension with a `name` that already exists in the table.

#### Scenario: Duplicate name rejected
- **WHEN** a dimension with `name = "security"` already exists
- **WHEN** `createDimensionConfig({ name: "security", ... })` is called
- **THEN** the operation fails with a uniqueness constraint error
