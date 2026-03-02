## ADDED Requirements

### Requirement: Classification function returns structured result with reason
The `classifyPullRequest` function SHALL return an object `{ classification: AiClassification, reason: string }` instead of a plain `AiClassification` string.

#### Scenario: Bot classification includes reason
- **WHEN** a PR is authored by `dependabot[bot]` (in the bot list)
- **THEN** the function SHALL return `{ classification: "bot", reason: "Author 'dependabot[bot]' matches bot list" }`

#### Scenario: AI classification includes reason with pattern match details
- **WHEN** a PR has 3 commits and all 3 have `Co-Authored-By: Claude <noreply@anthropic.com>`
- **THEN** the function SHALL return `{ classification: "ai", reason: "All 3/3 commits have Co-Authored-By matching pattern '*Claude*'" }`

#### Scenario: Mixed classification includes reason with match count
- **WHEN** a PR has 4 commits and 2 have AI co-author trailers
- **THEN** the function SHALL return `{ classification: "mixed", reason: "2/4 commits have Co-Authored-By matching AI patterns" }`

#### Scenario: Human classification includes reason
- **WHEN** a PR has 5 commits and none have AI co-author trailers and the author is not a bot
- **THEN** the function SHALL return `{ classification: "human", reason: "No AI co-author found in 5 commits" }`

#### Scenario: Human classification with zero commits
- **WHEN** a PR has 0 commits and the author is not a bot
- **THEN** the function SHALL return `{ classification: "human", reason: "No commits to analyze" }`

### Requirement: Classification reason is persisted in database
The system SHALL store the classification reason in a `classification_reason` column in the `pull_requests` table.

#### Scenario: Reason stored during sync
- **WHEN** a PR is synced from GitHub and classified
- **THEN** the classification reason text SHALL be stored in the `classification_reason` column

#### Scenario: Existing PRs have null reason
- **WHEN** a PR was synced before this feature existed
- **THEN** the `classification_reason` column SHALL be `null`

#### Scenario: Reason updated on re-sync
- **WHEN** a PR is re-synced (upsert)
- **THEN** the `classification_reason` SHALL be updated to the current classification reason

### Requirement: Database migration adds classification_reason column
The system SHALL add a nullable `classification_reason TEXT` column to the `pull_requests` table via a Drizzle migration.

#### Scenario: Migration runs successfully
- **WHEN** the migration is applied
- **THEN** the `pull_requests` table SHALL have a `classification_reason` column of type `TEXT` with default value `null`
