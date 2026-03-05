## ADDED Requirements

### Requirement: Display name is EM Lighthouse
The application SHALL display "EM Lighthouse" as the project name in all user-facing locations including the sidebar header, page title, and meta description.

#### Scenario: Sidebar shows new name
- **WHEN** the user opens the application
- **THEN** the sidebar header SHALL display "EM Lighthouse"

#### Scenario: Page title shows new name
- **WHEN** the user loads any page
- **THEN** the browser tab title SHALL contain "EM Lighthouse"

#### Scenario: Meta description uses new name
- **WHEN** a search engine indexes the application
- **THEN** the meta description SHALL reference "EM Lighthouse"

### Requirement: Package identifier is em-lighthouse
The `package.json` name field SHALL be `em-lighthouse`.

#### Scenario: Package name in package.json
- **WHEN** inspecting `package.json`
- **THEN** the `name` field SHALL be `"em-lighthouse"`

### Requirement: Database file is named em-lighthouse.db
The SQLite database file SHALL be located at `data/em-lighthouse.db`.

#### Scenario: Application connects to renamed database
- **WHEN** the application starts
- **THEN** it SHALL connect to `data/em-lighthouse.db`

#### Scenario: Drizzle config points to renamed database
- **WHEN** running database migrations via Drizzle
- **THEN** the configuration SHALL reference `data/em-lighthouse.db`

#### Scenario: Database snapshot script uses renamed path
- **WHEN** running the database snapshot script
- **THEN** it SHALL read from `data/em-lighthouse.db`

### Requirement: Encryption key uses new project identifier
The encryption key derivation in `src/lib/crypto.ts` SHALL use `"em-lighthouse"` as the project identifier component.

#### Scenario: Crypto key derivation updated
- **WHEN** the application derives an encryption key
- **THEN** it SHALL use `hostname() + "em-lighthouse"` as the derivation input

### Requirement: Documentation references updated
All project documentation SHALL reference "EM Lighthouse" instead of "rAIdical-em".

#### Scenario: README uses new name
- **WHEN** reading the README.md
- **THEN** the project name SHALL be "EM Lighthouse"

#### Scenario: CLAUDE.md uses new name
- **WHEN** reading CLAUDE.md
- **THEN** the project description SHALL reference "EM Lighthouse"

### Requirement: No residual old name references
After the rename, the codebase SHALL NOT contain any references to "rAIdical-em" except in git history and OpenSpec archived changes.

#### Scenario: Grep for old name returns no results
- **WHEN** searching the codebase for "rAIdical-em" (excluding `openspec/changes/archive/` and `.git/`)
- **THEN** zero matches SHALL be found

### Requirement: Database import validation updated
The database import API route SHALL validate against "EM Lighthouse" database format in error messages.

#### Scenario: Import error message uses new name
- **WHEN** a user attempts to import an invalid database file
- **THEN** the error message SHALL reference "EM Lighthouse" instead of "rAIdical-em"
