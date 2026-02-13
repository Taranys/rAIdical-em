# US-024: Import Team Members from GitHub

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to import team members from a GitHub organization or by searching GitHub usernames so that I can quickly populate my team list without adding members one by one.

## Dependencies

- ✅ [US-005: Configure GitHub PAT](✅%20005-configure-github-pat.md) — a valid PAT is required to query the GitHub API
- ✅ [US-007: Add Team Member](✅%20007-add-team-member.md) — the manual add flow should exist first
- ✅ [US-022: Database Schema](✅%20022-database-schema-phase1.md) — team_members table must exist

## Acceptance Criteria

- [x] The team page has an "Import from GitHub" action
- [x] The import supports two modes:
  - Search by GitHub username — type-ahead search against the GitHub API
  - Browse organization members — list members of a GitHub organization accessible with the configured PAT
- [x] Browse mode supports filtering members by name and a "Select All" button to import an entire team at once
- [x] Selected users are added to the team_members table with their display name and avatar URL fetched from GitHub
- [x] Already-existing team members are skipped with a clear indication
- [x] The import respects GitHub API rate limits

## Plan and implementation details

### Implementation plan

**Architecture:** A Sheet (side panel) triggered from the team page header, with two modes (Search Users / Browse Organization) and multi-select import.

**API routes:**
- `GET /api/team/github-search?q=<query>` — searches GitHub users via `octokit.rest.search.users`, returns users + rate limit info
- `GET /api/team/github-org-members?org=<org>` — lists org members via `octokit.rest.orgs.listMembers`, returns members + rate limit info

**UI component:** `ImportGitHubSheet` — a Sheet with mode toggle, search/browse inputs, scrollable results list with checkboxes, and an import action bar.

**Key design decisions:**
- Reuses existing `POST /api/team` for each selected user during import (sequential calls). This avoids duplicating validation/dedup logic.
- Reuses existing `GET /api/settings/github-owners` for the org dropdown in browse mode.
- Client-side dedup marking: compares results against existing members list. Shows "Already added" Badge + disabled checkbox.
- Rate limit display: forwards `x-ratelimit-remaining` and `x-ratelimit-reset` from GitHub API responses.
- Search debounced at 300ms with minimum 2 characters.

### Implementation notes

**Files created:**
- `src/app/api/team/github-search/route.ts` + `route.test.ts` — GitHub user search API (5 unit tests)
- `src/app/api/team/github-org-members/route.ts` + `route.test.ts` — GitHub org members API (6 unit tests)
- `src/app/team/import-github-sheet.tsx` + `import-github-sheet.test.tsx` — Import Sheet component (11 unit tests)

**Files modified:**
- `src/app/team/page.tsx` — Added "Import from GitHub" button + Sheet integration
- `src/app/team/page.test.tsx` — Added test for Import button (1 new test)
- `e2e/team.spec.ts` — Added 2 E2E tests (button visibility + sheet opening)

**Total new tests:** 24 unit tests + 2 E2E tests

**Follow-up enhancements:**
- Browse mode: client-side filter input to search within loaded org members
- Browse mode: "Select All" button to select all importable (non-existing) members at once
- Settings page: repo form now auto-refreshes when PAT is saved or deleted (no page reload needed)
