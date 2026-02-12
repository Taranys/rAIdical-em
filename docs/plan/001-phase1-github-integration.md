# Plan 001 — Phase 1: GitHub Integration — PR Metrics & Review Comment Extraction

**Status:** Draft
**Phase:** 1
**Date:** 2026-02-12

---

## Overview

Phase 1 connects em-control-tower to a single GitHub organization/repository and builds the data foundation for all downstream features. It covers:

- GitHub PAT configuration via a settings UI
- Team member management (manual)
- PR and review data ingestion from GitHub
- Delivery metrics dashboard
- AI vs. human authorship heuristic definition

---

## User Stories

### Epic A — GitHub Configuration

#### US-001: Configure GitHub Personal Access Token

**As an** engineering manager,
**I want to** enter and save my GitHub Personal Access Token (PAT) in a settings page,
**So that** the application can authenticate against the GitHub API.

**Acceptance criteria:**

- A `/settings` page exists with a form to enter a GitHub PAT.
- The PAT is stored in the SQLite database (encrypted or obfuscated — not plain text).
- A "Test connection" button validates the PAT against the GitHub API and shows success/failure feedback.
- The PAT can be updated or deleted at any time.
- If no PAT is configured, the dashboard shows a prompt directing to settings.

---

#### US-002: Configure target GitHub repository

**As an** engineering manager,
**I want to** specify the GitHub organization and repository I want to track,
**So that** the application fetches data from the correct source.

**Acceptance criteria:**

- The settings page has fields for GitHub owner (org or user) and repository name.
- After entering valid values and a working PAT, a "Verify" action confirms the repo exists and is accessible.
- Owner and repository are stored in the database.
- Only one org/repo pair is supported at a time (single-repo scope).

---

### Epic B — Team Member Management

#### US-003: Add a team member manually

**As an** engineering manager,
**I want to** add a team member by providing their GitHub username,
**So that** the application tracks their activity.

**Acceptance criteria:**

- A `/team` page lists all registered team members.
- An "Add member" form accepts a GitHub username.
- On submit, the app validates the username exists on GitHub (via the API) and fetches their display name and avatar URL.
- The member is stored in the database with: GitHub username, display name, avatar URL, added date.
- Duplicate usernames are rejected with a clear error message.

---

#### US-004: Remove a team member

**As an** engineering manager,
**I want to** remove a team member from the tracked list,
**So that** I can keep the team roster up to date.

**Acceptance criteria:**

- Each team member row has a "Remove" action.
- A confirmation dialog appears before deletion.
- Removing a member does not delete their historical PR/review data (soft removal — data is retained for historical metrics).

---

#### US-005: View team member list

**As an** engineering manager,
**I want to** see all my tracked team members at a glance,
**So that** I know who is being monitored.

**Acceptance criteria:**

- The `/team` page shows a table/grid with: avatar, display name, GitHub username, date added.
- The list is sorted alphabetically by display name.
- If no members are added, a helpful empty state is shown with a prompt to add members.

---

### Epic C — GitHub Data Sync

#### US-006: Fetch pull requests from GitHub

**As an** engineering manager,
**I want** the application to fetch all pull requests from the configured repository,
**So that** PR data is available locally for metrics.

**Acceptance criteria:**

- A "Sync" action (manual trigger from the UI) fetches PRs from the GitHub API via Octokit.
- Fetched data includes: PR number, title, author, state (open/closed/merged), created date, merged date, additions, deletions, changed files count.
- PRs are stored in the SQLite database (upserted — no duplicates on re-sync).
- The sync respects GitHub API rate limits and handles pagination.
- Only PRs authored by or reviewing by tracked team members are relevant (but all PRs are fetched and stored; filtering happens at display time).

---

#### US-007: Fetch PR reviews from GitHub

**As an** engineering manager,
**I want** the application to fetch all reviews for each pull request,
**So that** I can track who reviewed what and how often.

**Acceptance criteria:**

- During sync, for each PR, the app fetches reviews via the GitHub API.
- Stored data: review ID, PR number, reviewer username, review state (APPROVED, CHANGES_REQUESTED, COMMENTED), submitted date.
- Reviews are upserted on re-sync.

---

#### US-008: Fetch PR review comments from GitHub

**As an** engineering manager,
**I want** the application to fetch all review comments from pull requests,
**So that** review content is available for future categorization (Phase 2).

**Acceptance criteria:**

- During sync, for each PR, the app fetches review comments (line-level comments) via the GitHub API.
- Stored data: comment ID, PR number, reviewer username, body (raw text), file path, line number, created date, updated date.
- General PR comments (non-review, issue-style comments) are also fetched and stored separately.
- Comments are upserted on re-sync.

---

#### US-009: View sync status and history

**As an** engineering manager,
**I want to** see when the last sync happened and whether it succeeded,
**So that** I know if my data is up to date.

**Acceptance criteria:**

- The settings page (or a dedicated section) shows: last sync timestamp, sync status (success/failure/in progress), number of PRs and comments fetched.
- A sync history log shows the last N sync runs with their status and counts.
- During an active sync, a progress indicator is shown.

---

#### US-010: Incremental sync

**As an** engineering manager,
**I want** subsequent syncs to only fetch new or updated data,
**So that** syncing is fast and doesn't hit rate limits unnecessarily.

**Acceptance criteria:**

- After the first full sync, subsequent syncs only fetch PRs updated after the last sync timestamp.
- The sync uses the `since` parameter on the GitHub API where available.
- Newly updated PRs have their reviews and comments re-fetched.

---

### Epic D — Delivery Metrics Dashboard

#### US-011: View PRs opened per team member

**As an** engineering manager,
**I want to** see how many PRs each team member opened over a given period,
**So that** I can understand individual throughput.

**Acceptance criteria:**

- The dashboard (`/dashboard` or `/`) shows a bar chart or table of PRs opened per team member.
- A date range picker allows filtering (e.g., last 7 days, last 30 days, custom range).
- Only PRs authored by tracked team members are counted.

---

#### US-012: View PR size per team member

**As an** engineering manager,
**I want to** see the average PR size (lines added/removed) per team member,
**So that** I can spot overly large PRs and encourage smaller, reviewable changes.

**Acceptance criteria:**

- The dashboard shows average additions and deletions per PR, per team member.
- A visual indicator (e.g., color coding) highlights PRs above a configurable threshold (default: 500 lines).
- Clicking a team member drills down to their individual PR list with sizes.

---

#### US-013: View PRs reviewed per team member

**As an** engineering manager,
**I want to** see how many PRs each team member reviewed over a given period,
**So that** I can identify review load imbalances.

**Acceptance criteria:**

- The dashboard shows a count of PRs reviewed per team member for the selected period.
- "Reviewed" means the member submitted at least one review (APPROVED, CHANGES_REQUESTED, or COMMENTED).
- The chart/table allows comparison across the team.

---

#### US-014: View comments per review per team member

**As an** engineering manager,
**I want to** see the average number of review comments each team member leaves per PR reviewed,
**So that** I can gauge review depth.

**Acceptance criteria:**

- The dashboard shows average comments per review, per team member.
- Only review comments (not general PR comments) are counted.
- A low average could indicate rubber-stamping; a high average could indicate thoroughness — both are surfaced without judgment (data informs, humans decide).

---

#### US-015: Dashboard period selector

**As an** engineering manager,
**I want to** filter all dashboard metrics by a time period,
**So that** I can compare trends across sprints or quarters.

**Acceptance criteria:**

- A global date range selector at the top of the dashboard applies to all metric cards.
- Preset options: last 7 days, last 14 days, last 30 days, last 90 days, custom range.
- The selected period persists during the session (not across page reloads — no requirement for persistence).

---

### Epic E — AI vs. Human Authorship

#### US-016: Define AI authorship heuristic

**As an** engineering manager,
**I want to** configure the rules that determine whether a PR is AI-generated,
**So that** the AI vs. human ratio reflects my team's actual workflow.

**Acceptance criteria:**

- The settings page has a section for AI detection rules.
- Supported heuristics (configurable, multiple can be active):
  - **Co-author pattern**: PR commits contain a `Co-Authored-By` trailer matching a configurable pattern (e.g., `*[bot]*`, `*Claude*`, `*Copilot*`).
  - **Author is bot**: PR author username matches a configurable list (e.g., `dependabot`, `renovate`).
  - **Branch name pattern**: Branch name matches a configurable pattern (e.g., `ai/*`, `copilot/*`).
  - **Label-based**: PR has a specific GitHub label (e.g., `ai-generated`).
- Default heuristics are pre-filled but editable.
- Each PR is tagged as `ai`, `human`, or `mixed` based on the active rules.

---

#### US-017: View AI vs. human authorship ratio

**As an** engineering manager,
**I want to** see the ratio of AI-generated vs. human-written PRs per team member,
**So that** I can understand how AI adoption evolves across the team.

**Acceptance criteria:**

- The dashboard shows a stacked bar chart or percentage breakdown per team member: AI / Human / Mixed.
- The global date range filter applies.
- A team-level aggregate is also shown (total AI vs. human across all members).

---

### Epic F — Database Schema

#### US-018: Design and implement the Phase 1 database schema

**As a** developer,
**I want** a well-structured database schema for Phase 1 data,
**So that** data is stored efficiently and supports all dashboard queries.

**Acceptance criteria:**

- Drizzle ORM schema defines the following tables:
  - `settings` — key/value store for PAT, org, repo, AI heuristic config.
  - `team_members` — GitHub username, display name, avatar URL, active flag, created/updated timestamps.
  - `pull_requests` — PR number, title, author, state, created/merged dates, additions, deletions, changed files, ai_classification, raw JSON (for future use).
  - `reviews` — review ID, PR number, reviewer, state, submitted date.
  - `review_comments` — comment ID, PR number, reviewer, body, file path, line, created/updated dates.
  - `pr_comments` — comment ID, PR number, author, body, created/updated dates.
  - `sync_runs` — run ID, started at, completed at, status, PR count, comment count, error message.
- Migrations are generated via `npm run db:generate` and applied via `npm run db:migrate`.
- Foreign keys and indexes are defined for common query patterns.

---

### Epic G — Navigation & Layout

#### US-019: Application shell and navigation

**As an** engineering manager,
**I want** a clean navigation layout with sidebar or top nav,
**So that** I can easily move between dashboard, team, and settings pages.

**Acceptance criteria:**

- A persistent layout wraps all pages with navigation links to: Dashboard, Team, Settings.
- The current page is visually highlighted in the navigation.
- The layout is responsive (works on laptop screens; mobile is not required).
- The app title "em-control-tower" is visible in the header/sidebar.

---

## Story dependency graph

```
US-018 (Schema)
  └─→ US-001 (PAT config)
        └─→ US-002 (Repo config)
              └─→ US-003 (Add member)
                    ├─→ US-004 (Remove member)
                    ├─→ US-005 (View members)
                    └─→ US-006 (Fetch PRs)
                          ├─→ US-007 (Fetch reviews)
                          │     └─→ US-008 (Fetch comments)
                          ├─→ US-009 (Sync status)
                          └─→ US-010 (Incremental sync)

US-015 (Period selector)
  ├─→ US-011 (PRs opened)
  ├─→ US-012 (PR size)
  ├─→ US-013 (PRs reviewed)
  ├─→ US-014 (Comments per review)
  └─→ US-017 (AI vs. human ratio)

US-016 (AI heuristic config) ─→ US-017 (AI vs. human ratio)

US-019 (App shell) — independent, can be built in parallel
```

---

## Out of scope for Phase 1

- Comment categorization (Phase 2)
- Seniority profiling (Phase 2)
- Highlight reel / 1:1 prep view (Phase 3)
- Slack, Confluence, Jira integration (Phase 4)
- OKR-to-goals engine (Phase 5)
- Multi-repo / multi-org support
- Automatic scheduled sync (manual trigger only)
- User authentication / multi-user access (single-user local app)
