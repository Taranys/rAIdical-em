## ADDED Requirements

### Requirement: Seniority computation runs after classification completes

The system SHALL trigger seniority profile computation only after comment classification has completed successfully, not concurrently with it.

#### Scenario: Sync triggers classification then seniority sequentially

- **WHEN** a GitHub sync completes successfully and auto-classify is enabled and LLM provider is configured
- **THEN** the system MUST first run `classifyComments()` to completion, and only after it resolves successfully, run `computeSeniorityProfiles()`

#### Scenario: Sync with classification disabled still triggers seniority

- **WHEN** a GitHub sync completes and auto-classify is disabled (`auto_classify_on_sync` is "false") but LLM is configured
- **THEN** the system MUST still trigger `computeSeniorityProfiles()` (using existing classified data)

#### Scenario: Classification failure does not trigger seniority

- **WHEN** a GitHub sync completes and classification fails (throws an error)
- **THEN** the system MUST NOT trigger `computeSeniorityProfiles()` and existing seniority profiles MUST remain unchanged

### Requirement: Existing profiles preserved when no classified data available

The system SHALL preserve existing seniority profiles when recomputation finds no classified comments, instead of deleting all profiles and leaving the table empty.

#### Scenario: No classified comments found during computation

- **WHEN** `computeSeniorityProfiles()` runs and `getClassifiedCommentsForProfile()` returns an empty result for all team members
- **THEN** the system MUST return early without calling `deleteAllProfiles()`, preserving existing seniority data

#### Scenario: Classified comments available triggers normal recomputation

- **WHEN** `computeSeniorityProfiles()` runs and at least one team member has classified comments
- **THEN** the system MUST proceed with the normal flow: delete existing profiles and recompute from classified data

### Requirement: Classification already running skips seniority chaining

The system SHALL not chain seniority computation when an active classification run already exists (to avoid duplicate concurrent computations).

#### Scenario: Active classification run prevents duplicate chain

- **WHEN** a GitHub sync completes and `getActiveClassificationRun()` returns an active run
- **THEN** the system MUST skip both classification and seniority computation (another sync already triggered them)
