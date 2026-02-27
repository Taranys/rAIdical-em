## 1. Team member lookup helper

- [x] 1.1 Add a `getActiveTeamMemberUsernames` function in `src/db/team-members.ts` that returns a `Set<string>` of active team member GitHub usernames
- [x] 1.2 Write a unit test for `getActiveTeamMemberUsernames` (returns correct set, returns empty set when no members)

## 2. Filter sync logic

- [x] 2.1 In `src/lib/github-sync.ts`, import `getActiveTeamMemberUsernames` and load the set at the start of `syncPullRequests`
- [x] 2.2 Wrap the review upsert loop with a team membership check — skip `upsertReview` if reviewer is not in the set (skip filtering if set is empty)
- [x] 2.3 Wrap the review comment upsert loop with a team membership check — skip `upsertReviewComment` if reviewer is not in the set (skip filtering if set is empty)
- [x] 2.4 Wrap the PR comment upsert loop with a team membership check — skip `upsertPrComment` if author is not in the set (skip filtering if set is empty)
- [x] 2.5 Ensure `reviewCount` and `commentCount` only increment for persisted (team member) items

## 3. Sync page UI explanation

- [x] 3.1 Add an informational Alert on the sync page (`src/app/sync/page.tsx`) explaining that only team member comments are synced and analyzed, visible only when team members are configured

## 4. Tests

- [x] 4.1 Write a unit test for `syncPullRequests` verifying that comments/reviews from non-team members are not upserted
- [x] 4.2 Write a unit test verifying that when no team members exist, all comments/reviews are persisted (backward compatibility)
- [x] 4.3 Write a unit test verifying sync counts only include team member items
