### Requirement: Seniority profiles exclude language dimensions
The seniority profile computation service SHALL NOT generate per-language dimension profiles. Only dimensions that are enabled in the `seniorityDimensionConfigs` database table SHALL be computed and stored.

#### Scenario: Recomputation produces only enabled configured dimensions
- **WHEN** `computeSeniorityProfiles()` is invoked for a team member who has review comments across multiple programming languages
- **THEN** the resulting profiles contain only dimensions whose names match enabled entries in the `seniorityDimensionConfigs` table
- **THEN** no dimension with a language name (e.g., "typescript", "python", "ruby") is stored in `seniorityProfiles`

#### Scenario: Stale language profiles are removed on recomputation
- **WHEN** the database contains existing per-language seniority profiles from a previous computation
- **WHEN** `computeSeniorityProfiles()` is invoked
- **THEN** the existing `deleteAllProfiles()` call removes all profiles including stale language profiles before new configured-dimension profiles are inserted

### Requirement: UI displays only enabled configured dimensions
The Team Profiles UI SHALL display only dimensions that are enabled in the `seniorityDimensionConfigs` database table. Any profile with a dimension name not matching an enabled configured dimension SHALL be excluded from both the radar chart and the dimension list.

#### Scenario: Radar chart shows only enabled configured dimensions
- **WHEN** a team member's profiles are rendered in the radar chart component
- **THEN** only dimensions matching enabled entries in `seniorityDimensionConfigs` appear as axes on the radar chart

#### Scenario: Dimension list excludes unconfigured dimensions
- **WHEN** a team member's profile card renders the expandable dimension list
- **THEN** only rows for enabled configured dimensions are displayed
- **THEN** no row for a language-based or disabled dimension appears

#### Scenario: Empty profiles after filtering
- **WHEN** a team member has only profiles for disabled or unconfigured dimensions
- **THEN** the radar chart is not rendered for that member
- **THEN** the dimension list section is not rendered for that member

### Requirement: Known dimensions set is dynamically computed
The `seniority-dimensions.ts` module SHALL export a `getActiveDimensionNames()` function that returns the set of enabled dimension names from the database, replacing the hardcoded `ALL_DEFINED_DIMENSION_NAMES` constant.

#### Scenario: Function returns currently enabled dimension names
- **WHEN** `getActiveDimensionNames()` is called
- **THEN** it returns a `Set<string>` containing the names of all dimensions with `isEnabled = 1` in the `seniorityDimensionConfigs` table
- **THEN** if the EM has disabled "testing" and added "observability", the set includes "observability" but not "testing"
