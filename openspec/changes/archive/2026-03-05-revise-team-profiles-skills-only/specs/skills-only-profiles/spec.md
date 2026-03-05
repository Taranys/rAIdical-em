## ADDED Requirements

### Requirement: Seniority profiles exclude language dimensions
The seniority profile computation service SHALL NOT generate per-language dimension profiles. Only dimensions explicitly defined in `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS` SHALL be computed and stored.

#### Scenario: Recomputation produces only defined dimensions
- **WHEN** `computeSeniorityProfiles()` is invoked for a team member who has review comments across multiple programming languages
- **THEN** the resulting profiles contain only dimensions whose names match entries in `TECHNICAL_CATEGORY_DIMENSIONS` (security, architecture, performance, testing) and `SOFT_SKILL_DIMENSIONS` (pedagogy, cross_team_awareness, boldness, thoroughness)
- **THEN** no dimension with a language name (e.g., "typescript", "python", "ruby") is stored in `seniorityProfiles`

#### Scenario: Stale language profiles are removed on recomputation
- **WHEN** the database contains existing per-language seniority profiles from a previous computation
- **WHEN** `computeSeniorityProfiles()` is invoked
- **THEN** the existing `deleteAllProfiles()` call removes all profiles including stale language profiles before new defined-dimension profiles are inserted

### Requirement: UI displays only defined dimensions
The Team Profiles UI SHALL display only dimensions that are part of the known defined dimensions set (`TECHNICAL_CATEGORY_DIMENSIONS` names + `SOFT_SKILL_DIMENSIONS` names). Any profile with a dimension name not in this set SHALL be excluded from both the radar chart and the dimension list.

#### Scenario: Radar chart shows only defined dimensions
- **WHEN** a team member's profiles are rendered in the radar chart component
- **THEN** only dimensions matching `TECHNICAL_CATEGORY_DIMENSIONS` or `SOFT_SKILL_DIMENSIONS` names appear as axes on the radar chart

#### Scenario: Dimension list excludes unknown dimensions
- **WHEN** a team member's profile card renders the expandable dimension list
- **THEN** only rows for defined dimensions (technical categories + soft skills) are displayed
- **THEN** no row for a language-based dimension (e.g., "Typescript", "Python") appears

#### Scenario: Empty profiles after filtering
- **WHEN** a team member has only language-based profiles and no defined-dimension profiles
- **THEN** the radar chart is not rendered for that member
- **THEN** the dimension list section is not rendered for that member

### Requirement: Known dimensions set is exported
The `seniority-dimensions.ts` module SHALL export an `ALL_DEFINED_DIMENSION_NAMES` constant containing the union of all dimension names from `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS`. This set SHALL be usable by both service and UI code for filtering.

#### Scenario: Constant contains all defined dimension names
- **WHEN** `ALL_DEFINED_DIMENSION_NAMES` is accessed
- **THEN** it contains exactly the names: "security", "architecture", "performance", "testing", "pedagogy", "cross_team_awareness", "boldness", "thoroughness"
