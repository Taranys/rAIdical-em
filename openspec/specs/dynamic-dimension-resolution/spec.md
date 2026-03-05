### Requirement: Computation service reads dimensions from database
The `computeSeniorityProfiles()` function SHALL read active seniority dimensions from the `seniorityDimensionConfigs` database table instead of importing hardcoded constants.

#### Scenario: Technical dimensions read from DB
- **WHEN** `computeSeniorityProfiles()` is invoked
- **THEN** it calls `getEnabledDimensionConfigs()` to retrieve active technical dimensions
- **THEN** for each technical dimension, it uses the `sourceCategories` from the DB row to filter comments
- **THEN** it does NOT reference the hardcoded `TECHNICAL_CATEGORY_DIMENSIONS` constant

#### Scenario: Soft skill dimensions read from DB
- **WHEN** `computeSeniorityProfiles()` is invoked
- **THEN** it retrieves active soft skill dimensions from the DB
- **THEN** it passes the DB-stored name and description to the LLM soft skill prompt builder
- **THEN** it does NOT reference the hardcoded `SOFT_SKILL_DIMENSIONS` constant

#### Scenario: Disabled dimensions are skipped
- **WHEN** a dimension has `isEnabled = 0` in the database
- **THEN** `computeSeniorityProfiles()` does NOT compute a profile for that dimension
- **THEN** existing profile rows for the disabled dimension are NOT deleted (preserved for history)

#### Scenario: Empty dimensions list produces no profiles
- **WHEN** all dimensions are disabled
- **THEN** `computeSeniorityProfiles()` skips dimension processing
- **THEN** the function returns `profilesGenerated: 0` without error

### Requirement: Accessor functions replace hardcoded constants
The `seniority-dimensions.ts` module SHALL export synchronous accessor functions that read from the database, replacing the exported constant arrays.

#### Scenario: getActiveTechnicalDimensions returns DB-backed results
- **WHEN** `getActiveTechnicalDimensions()` is called
- **THEN** it returns an array of `TechnicalCategoryDimension` objects from enabled DB rows with `family = 'technical'`
- **THEN** each object includes `name`, `family`, `description`, and `sourceCategories` parsed from JSON

#### Scenario: getActiveSoftSkillDimensions returns DB-backed results
- **WHEN** `getActiveSoftSkillDimensions()` is called
- **THEN** it returns an array of `SeniorityDimension` objects from enabled DB rows with `family = 'soft_skill'`

#### Scenario: getActiveDimensionNames returns enabled dimension names
- **WHEN** `getActiveDimensionNames()` is called
- **THEN** it returns a `Set<string>` containing the `name` values of all enabled dimensions

### Requirement: Team profiles API uses dynamic dimensions
The `/api/team-profiles` endpoint SHALL filter seniority profiles against the currently-enabled dimensions from the database.

#### Scenario: Profiles filtered by active dimensions
- **WHEN** `GET /api/team-profiles` is called
- **THEN** only profiles whose `dimensionName` matches an enabled dimension in the DB are included in the response
- **THEN** profiles for disabled or deleted dimensions are excluded

### Requirement: Radar chart adapts to configured dimensions
The seniority radar chart component SHALL render axes based on the currently-enabled dimensions from the database, not hardcoded names.

#### Scenario: Radar chart shows configured dimensions
- **WHEN** the team profiles page renders a member's radar chart
- **THEN** the chart axes correspond to the enabled dimensions from the API response
- **THEN** if the EM has configured 6 dimensions (3 technical + 3 soft skills), the radar chart shows 6 axes

#### Scenario: Radar chart handles custom dimensions
- **WHEN** the EM has added a custom dimension "observability" and it has a computed profile
- **THEN** the radar chart includes an "observability" axis with the correct maturity level

### Requirement: Team profiles dimension list adapts to configured dimensions
The expandable dimension list in team profile cards SHALL only show dimensions that are currently enabled in the database.

#### Scenario: Dimension list matches enabled config
- **WHEN** a team member's profile card renders the dimension list
- **THEN** only rows for enabled dimensions with existing profiles are displayed
- **THEN** the order follows the `sortOrder` from the dimension configuration
