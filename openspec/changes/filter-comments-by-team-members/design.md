## Context

The GitHub sync pipeline (`src/lib/github-sync.ts`) currently persists every review comment, PR comment, and review fetched from GitHub, regardless of who wrote it. The downstream LLM-powered analysis (classification, seniority profiles, highlights) only cares about active team members. This means:

- Non-team comments are stored in the DB but never used for meaningful analysis.
- LLM API calls are wasted classifying irrelevant comments.
- Metrics can be slightly skewed by non-team data in aggregate queries.

Team members are stored in `team_members` table with a `githubUsername` field and `isActive` flag. The sync already fetches team members for the progress card on the sync page.

## Goals / Non-Goals

**Goals:**
- Filter reviews, review comments, and PR comments at sync time so only those from active team members are persisted.
- Add an explanatory callout on the Sync page so the EM understands why some comments don't appear.
- Keep the filtering logic simple and contained in `github-sync.ts`.

**Non-Goals:**
- Purging existing non-team data from the database (can be done manually if desired).
- Filtering PRs themselves — all PRs are still synced (PRs authored by non-team members may still be reviewed by team members).
- Making the filter configurable (toggle on/off) — team-scoped filtering is always on.

## Decisions

### 1. Filter at upsert time in `syncPullRequests`

**Decision:** Build a `Set<string>` of active team member GitHub usernames at the start of `syncPullRequests`, then check each comment/review author against this set before calling `upsert*`.

**Rationale:** This is the simplest approach — no schema changes, no new queries, minimal code changes. The alternative (filtering at query time in downstream services) would still store unnecessary data and waste space.

**Alternative considered:** Filter at the GitHub API level (query by author). GitHub's API doesn't support filtering comments by author, so this isn't feasible.

### 2. Pass team member usernames into the sync function

**Decision:** Load active team members inside `syncPullRequests` by calling `getAllTeamMembers()` at the start and extracting usernames into a Set. If no team members are configured, sync proceeds without filtering (backward-compatible).

**Rationale:** The sync function already imports from `@/db/settings` and other modules. Adding one more import keeps the dependency simple. No need to thread it through the API route.

### 3. UI callout placement

**Decision:** Add an informational `Alert` component (from shadcn/ui) inside the main sync Card, below the sync status indicator, visible at all times when team members exist.

**Rationale:** This is the most natural location — close to the "Sync Now" button where the user initiates the action. Using shadcn/ui Alert is consistent with the existing UI patterns.

## Risks / Trade-offs

- **[Risk] Team member added after sync**: If an EM adds a new team member after some syncs have already been done, that member's older comments won't be in the DB. → **Mitigation:** Re-syncing the same period will pick up the new member's comments (upsert is idempotent). This is acceptable and self-correcting.
- **[Risk] All reviews/comments filtered if no team members configured**: → **Mitigation:** If the team member Set is empty, skip filtering entirely — persist everything. This handles the bootstrapping case.
- **[Trade-off] Slightly more work per comment (Set lookup)**: O(1) per lookup with a Set is negligible vs. the GitHub API call cost.
