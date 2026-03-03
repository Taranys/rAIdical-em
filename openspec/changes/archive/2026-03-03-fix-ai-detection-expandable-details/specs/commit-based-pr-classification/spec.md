## MODIFIED Requirements

### Requirement: Commit-only AI classification
The system SHALL classify non-bot PR authorship based exclusively on commit co-author analysis. Branch name patterns and PR labels SHALL NOT influence the classification result. The classification function SHALL return a structured result `{ classification: AiClassification, reason: string }` instead of a plain `AiClassification` string.

#### Scenario: PR with all AI co-authored commits is classified as "ai" with reason
- **WHEN** a PR is not authored by a bot, has 3 commits, and all 3 commits contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"ai"` with a reason indicating all commits matched

#### Scenario: PR with mixed commits is classified as "mixed" with reason
- **WHEN** a PR is not authored by a bot, has 3 commits, and only 1 commit contains a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"mixed"` with a reason indicating 1/3 commits matched

#### Scenario: PR with no AI co-authored commits is classified as "human" with reason
- **WHEN** a PR is not authored by a bot, has 3 commits, and none contain a `Co-Authored-By` trailer matching an AI pattern
- **THEN** the PR SHALL be classified as `"human"` with a reason indicating no matches found

#### Scenario: PR with no commits defaults to "human" with reason
- **WHEN** a PR is not authored by a bot and has 0 commits (edge case)
- **THEN** the PR SHALL be classified as `"human"` with a reason indicating no commits to analyze

### Requirement: Bot classification
The system SHALL classify a PR as `"bot"` when the PR author matches an entry in the configured bot author list. The result SHALL include a reason indicating which bot was matched.

#### Scenario: Dependabot PR classified as bot with reason
- **WHEN** a PR is authored by `dependabot[bot]` and `dependabot[bot]` is in the `authorBotList`
- **THEN** the PR SHALL be classified as `"bot"` with a reason referencing the matched bot author
