## ADDED Requirements

### Requirement: Commit-only classification
The system SHALL classify PR authorship based exclusively on commit co-author analysis. Branch name patterns, PR labels, and bot author lists SHALL NOT influence the classification result.

#### Scenario: PR with all AI co-authored commits is classified as "ai"
- **WHEN** a PR has 3 commits and all 3 commits contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"ai"`

#### Scenario: PR with mixed commits is classified as "mixed"
- **WHEN** a PR has 3 commits and only 1 commit contains a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"mixed"`

#### Scenario: PR with no AI co-authored commits is classified as "human"
- **WHEN** a PR has 3 commits and none contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"human"`

#### Scenario: PR with no commits defaults to "human"
- **WHEN** a PR has 0 commits (edge case)
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: Branch name does not affect classification
The system SHALL NOT use branch name patterns to determine PR authorship classification.

#### Scenario: AI-named branch with human commits
- **WHEN** a PR is on a branch named `claude/fix-typo` and all commits have only human authors (no AI co-author)
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: PR labels do not affect classification
The system SHALL NOT use PR labels to determine PR authorship classification.

#### Scenario: AI-labeled PR with human commits
- **WHEN** a PR has the label `ai-generated` but all commits have only human authors (no AI co-author)
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: Bot author does not affect classification
The system SHALL NOT use the PR author identity (bot list) to determine PR authorship classification.

#### Scenario: Bot-authored PR with no AI co-authors
- **WHEN** a PR is authored by `dependabot[bot]` but no commits have AI co-authors
- **THEN** the PR SHALL be classified as `"human"`

### Requirement: Simplified heuristics configuration
The system SHALL provide a simplified configuration containing only co-author patterns and an enabled flag. The `authorBotList`, `branchNamePatterns`, `labels`, and per-heuristic enabled flags SHALL be removed.

#### Scenario: Default configuration contains only co-author settings
- **WHEN** no custom configuration is stored
- **THEN** the system SHALL use a default configuration with `coAuthorPatterns: ["*Claude*", "*Copilot*", "*[bot]*"]` and `enabled: true`

#### Scenario: Legacy configuration is migrated
- **WHEN** the stored configuration has the old shape (with `authorBotList`, `branchNamePatterns`, `labels`, and `enabled` object)
- **THEN** the system SHALL extract `coAuthorPatterns` and `enabled.coAuthor` from the old config and use them as the new simplified config

### Requirement: Classification disabled returns human
The system SHALL classify all PRs as `"human"` when co-author classification is disabled.

#### Scenario: Classification disabled
- **WHEN** the heuristics configuration has `enabled: false`
- **THEN** all PRs SHALL be classified as `"human"` regardless of commit co-authors
