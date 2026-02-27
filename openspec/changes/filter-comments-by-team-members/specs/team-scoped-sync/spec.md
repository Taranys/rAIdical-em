## ADDED Requirements

### Requirement: Sync filters reviews by team membership
The system SHALL only persist reviews (in the `reviews` table) where the reviewer's GitHub username matches an active team member. Reviews from non-team users SHALL be skipped during sync.

#### Scenario: Review from team member is persisted
- **WHEN** a GitHub sync runs and a PR has a review from user "alice" who is an active team member
- **THEN** the review is upserted into the `reviews` table

#### Scenario: Review from non-team user is skipped
- **WHEN** a GitHub sync runs and a PR has a review from user "external-bot" who is not a team member
- **THEN** the review is NOT inserted into the `reviews` table

#### Scenario: No team members configured disables filtering
- **WHEN** a GitHub sync runs and no team members exist in the database
- **THEN** all reviews are persisted regardless of author (backward-compatible behavior)

### Requirement: Sync filters review comments by team membership
The system SHALL only persist review comments (inline code comments) where the commenter's GitHub username matches an active team member. Review comments from non-team users SHALL be skipped during sync.

#### Scenario: Review comment from team member is persisted
- **WHEN** a GitHub sync runs and a review comment is authored by "bob" who is an active team member
- **THEN** the review comment is upserted into the `review_comments` table

#### Scenario: Review comment from non-team user is skipped
- **WHEN** a GitHub sync runs and a review comment is authored by "dependabot" who is not a team member
- **THEN** the review comment is NOT inserted into the `review_comments` table

### Requirement: Sync filters PR comments by team membership
The system SHALL only persist PR comments (issue-style discussion comments) where the author's GitHub username matches an active team member. PR comments from non-team users SHALL be skipped during sync.

#### Scenario: PR comment from team member is persisted
- **WHEN** a GitHub sync runs and a PR comment is authored by "carol" who is an active team member
- **THEN** the PR comment is upserted into the `pr_comments` table

#### Scenario: PR comment from non-team user is skipped
- **WHEN** a GitHub sync runs and a PR comment is authored by "random-contributor" who is not a team member
- **THEN** the PR comment is NOT inserted into the `pr_comments` table

### Requirement: Sync page displays team-scoped explanation
The sync page SHALL display an informational message explaining that only comments from team members are synced and analyzed. This message SHALL be visible whenever team members are configured.

#### Scenario: Explanation visible with team members
- **WHEN** an EM visits the sync page and at least one team member is configured
- **THEN** an informational callout is displayed stating that only team member comments are synced and analyzed

#### Scenario: Explanation hidden without team members
- **WHEN** an EM visits the sync page and no team members are configured
- **THEN** the informational callout about team-scoped sync is NOT displayed

### Requirement: Comment count reflects only team member comments
The sync progress and final counts (reviews, comments) SHALL only count items that were actually persisted (i.e., from team members). Non-team items SHALL not be included in the displayed counts.

#### Scenario: Counts exclude non-team comments
- **WHEN** a sync completes and 10 review comments were fetched from GitHub, of which 7 are from team members
- **THEN** the sync run's comment count shows 7, not 10
