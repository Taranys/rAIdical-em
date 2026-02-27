## Why

Currently, the GitHub sync fetches and stores **all** PR comments and review comments, including those from contributors outside the team (bots, external contributors, one-time reviewers). This pollutes the analysis pipeline — classification, seniority profiles, and highlights are computed on irrelevant data, wasting LLM API calls and adding noise to team metrics. Filtering at sync time reduces storage, speeds up analysis, and keeps the dashboard focused on the team's actual review culture.

## What Changes

- **Filter comments during sync**: During `syncPullRequests`, only upsert review comments and PR comments whose author/reviewer matches an active team member's `githubUsername`. Non-team comments are neither fetched into DB nor counted in sync progress.
- **Filter reviews during sync**: Similarly, only upsert reviews from team members.
- **UI explanation text**: Add a brief informational callout on the Sync page explaining that only comments from team members are synced and analyzed, so users understand why some comments may not appear.
- **Clean existing non-team data** (optional/future): Provide no automatic migration — existing data stays, but new syncs will only add team-member data.

## Capabilities

### New Capabilities
- `team-scoped-sync`: Filter GitHub sync to only persist comments and reviews from active team members. Add explanatory UI text on the sync page.

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Code**: `src/lib/github-sync.ts` (filtering logic), `src/app/sync/page.tsx` (UI callout), `src/db/team-members.ts` (query to get active member usernames for lookup)
- **APIs**: No new API routes. Sync API behavior changes (fewer records stored per sync).
- **Database**: No schema changes. Fewer rows inserted in `review_comments`, `pr_comments`, and `reviews` tables.
- **Dependencies**: None added.
