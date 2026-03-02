## ADDED Requirements

### Requirement: Four-category classification model
The system SHALL classify PR authorship into exactly four categories: `"bot"`, `"ai"`, `"mixed"`, and `"human"`. Bot detection SHALL take priority over co-author analysis.

#### Scenario: Classification priority — bot takes precedence over AI co-authors
- **WHEN** a PR is authored by `dependabot[bot]` (in the bot list) and all commits have AI co-authors
- **THEN** the PR SHALL be classified as `"bot"`

### Requirement: Bot classification
The system SHALL classify a PR as `"bot"` when the PR author matches an entry in the configured bot author list.

#### Scenario: Dependabot PR classified as bot
- **WHEN** a PR is authored by `dependabot[bot]` and `dependabot[bot]` is in the `authorBotList`
- **THEN** the PR SHALL be classified as `"bot"`

#### Scenario: Renovate PR classified as bot
- **WHEN** a PR is authored by `renovate[bot]` and `renovate[bot]` is in the `authorBotList`
- **THEN** the PR SHALL be classified as `"bot"`

#### Scenario: Bot detection is case-insensitive
- **WHEN** a PR is authored by `Dependabot[bot]` (different case) and `dependabot[bot]` is in the `authorBotList`
- **THEN** the PR SHALL be classified as `"bot"`

### Requirement: Commit-only AI classification
The system SHALL classify non-bot PR authorship based exclusively on commit co-author analysis. Branch name patterns and PR labels SHALL NOT influence the classification result.

#### Scenario: PR with all AI co-authored commits is classified as "ai"
- **WHEN** a PR is not authored by a bot, has 3 commits, and all 3 commits contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"ai"`

#### Scenario: PR with mixed commits is classified as "mixed"
- **WHEN** a PR is not authored by a bot, has 3 commits, and only 1 commit contains a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"mixed"`

#### Scenario: PR with no AI co-authored commits is classified as "human"
- **WHEN** a PR is not authored by a bot, has 3 commits, and none contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"human"`

#### Scenario: PR with no commits defaults to "human"
- **WHEN** a PR is not authored by a bot and has 0 commits (edge case)
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: Branch name does not affect classification
The system SHALL NOT use branch name patterns to determine PR authorship classification.

#### Scenario: AI-named branch with human commits
- **WHEN** a PR is on a branch named `claude/fix-typo` and all commits have only human authors (no AI co-author) and the PR author is not a bot
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: PR labels do not affect classification
The system SHALL NOT use PR labels to determine PR authorship classification.

#### Scenario: AI-labeled PR with human commits
- **WHEN** a PR has the label `ai-generated` but all commits have only human authors (no AI co-author) and the PR author is not a bot
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: Simplified heuristics configuration
The system SHALL provide a configuration containing co-author patterns, a bot author list, and per-heuristic enabled flags. The `branchNamePatterns`, `labels`, and their enabled flags SHALL be removed.

#### Scenario: Default configuration
- **WHEN** no custom configuration is stored
- **THEN** the system SHALL use a default configuration with `coAuthorPatterns: ["*Claude*", "*Copilot*", "*[bot]*"]`, `authorBotList: ["dependabot", "renovate", "dependabot[bot]", "renovate[bot]"]`, and both heuristics enabled

#### Scenario: Legacy configuration is migrated
- **WHEN** the stored configuration has the old shape (with `branchNamePatterns`, `labels`, and full `enabled` object)
- **THEN** the system SHALL extract `coAuthorPatterns`, `authorBotList`, `enabled.coAuthor`, and `enabled.authorBot` from the old config and use them as the new config

### Requirement: Disabled heuristic behavior
The system SHALL skip individual heuristics when they are disabled in configuration.

#### Scenario: Bot detection disabled — bot author classified by co-authors
- **WHEN** `enabled.authorBot` is `false` and a PR is authored by `dependabot[bot]` with no AI co-authors
- **THEN** the PR SHALL be classified as `"human"` (bot detection skipped, no AI co-authors found)

#### Scenario: Co-author detection disabled — all non-bot PRs are human
- **WHEN** `enabled.coAuthor` is `false` and a PR is not authored by a bot
- **THEN** the PR SHALL be classified as `"human"` regardless of commit co-authors

### Requirement: Dashboard displays bot category
The system SHALL display the `"bot"` category in the AI ratio chart with a distinct color separate from human, AI, and mixed.

#### Scenario: Bot PRs shown in team total
- **WHEN** the team has 10 human PRs, 5 AI PRs, 2 mixed PRs, and 3 bot PRs
- **THEN** the dashboard SHALL display all four categories with their respective counts and colors
