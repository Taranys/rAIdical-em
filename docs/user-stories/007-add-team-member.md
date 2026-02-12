# US-007: Add a Team Member

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to add a team member by providing their GitHub username so that the application tracks their activity.

## Acceptance Criteria

- [ ] A `/team` page lists all registered team members
- [ ] An "Add member" form accepts a GitHub username
- [ ] On submit, the app validates the username exists on GitHub (via the API) and fetches their display name and avatar URL
- [ ] The member is stored in the database with: GitHub username, display name, avatar URL, added date
- [ ] Duplicate usernames are rejected with a clear error message
