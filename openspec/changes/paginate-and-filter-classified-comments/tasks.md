## 1. Team-member filtering in database layer

- [ ] 1.1 Add team-member filtering to `getClassifiedComments()` in `src/db/comment-classifications.ts`: load active team usernames, add `WHERE IN` conditions to both review_comments and pr_comments queries when team members exist
- [ ] 1.2 Write unit tests for team-member filtering: with team members (only team comments returned), without team members (all comments returned), combined with reviewer filter

## 2. Server-side pagination in database layer

- [ ] 2.1 Add `page` and `pageSize` params to `getClassifiedComments()`, return `{ comments, totalCount, page, pageSize }` instead of a plain array — apply slicing after sort
- [ ] 2.2 Write unit tests for pagination: default page/pageSize, specific page, last page with fewer items, page beyond data

## 3. API route changes

- [ ] 3.1 Update `GET /api/review-quality/comments` route to accept `page` and `pageSize` query params, pass them to `getClassifiedComments()`, and return the paginated response shape `{ comments, totalCount, page, pageSize }`
- [ ] 3.2 Write integration test for the API route with pagination and team-member filtering params

## 4. Frontend pagination UI

- [ ] 4.1 Update `ReviewQualityContent` orchestrator: add `page` state, pass page to API fetch, reset page to 1 on filter/sort change, store `totalCount` in state
- [ ] 4.2 Update `fetchCommentsFromApi()` to send `page`/`pageSize` params and parse `totalCount` from the response
- [ ] 4.3 Add pagination controls below `CommentsTable`: Previous/Next buttons, "Page X of Y" indicator, disabled states at boundaries
- [ ] 4.4 Display total count in the Classified Comments card title (e.g., "Classified Comments (45)")

## 5. Validation

- [ ] 5.1 Run existing tests (`npm test`) to ensure no regressions
- [ ] 5.2 Manual smoke test: verify pagination navigates correctly, filters reset page, team filtering hides non-team comments
