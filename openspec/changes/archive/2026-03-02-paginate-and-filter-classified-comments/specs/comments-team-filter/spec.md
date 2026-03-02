## ADDED Requirements

### Requirement: Comments filtered to active team members
The `getClassifiedComments()` function SHALL only return comments authored by users whose `githubUsername` is in the active team members list. When no team members are configured, it SHALL return all comments (backward compatible).

#### Scenario: Team members exist
- **WHEN** the team has active members ["alice", "bob", "carol"]
- **THEN** only comments where reviewer/author is "alice", "bob", or "carol" are returned

#### Scenario: No team members configured
- **WHEN** the team members table is empty
- **THEN** all comments are returned regardless of reviewer/author

#### Scenario: Individual reviewer filter within team
- **WHEN** team members are ["alice", "bob"] and the reviewer filter is set to "alice"
- **THEN** only comments by "alice" are returned

### Requirement: Reviewer dropdown restricted to team members
The filter bar's reviewer dropdown SHALL only list active team members. The "All reviewers" option SHALL show comments from all team members (not all users).

#### Scenario: Dropdown options match team
- **WHEN** active team members are ["alice", "bob"]
- **THEN** the reviewer dropdown shows "All reviewers", "alice", and "bob" only

#### Scenario: Non-team reviewer not selectable
- **WHEN** a comment from "external-user" exists in the database but "external-user" is not an active team member
- **THEN** "external-user" does not appear in the reviewer dropdown and their comments are not shown
