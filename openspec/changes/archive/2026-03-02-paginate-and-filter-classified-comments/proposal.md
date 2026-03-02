## Why

The "Classified Comments" table currently loads all matching comments at once without pagination, which degrades usability when the dataset grows. Additionally, the table shows comments from all GitHub users, not just the selected team members, making it harder for EMs to focus on their team's review quality.

## What Changes

- Add server-side pagination (20 items per page) to the Classified Comments table and its backing API
- Filter comments to only show those authored by active team members (matching the team-scoped behavior already implemented in the sync layer)
- Add pagination UI controls (previous/next, current page indicator) below the table

## Capabilities

### New Capabilities
- `comments-pagination`: Server-side pagination for the classified comments API and table UI with 20 items per page
- `comments-team-filter`: Restrict classified comments to only show comments from active team members

### Modified Capabilities

## Impact

- **API**: `GET /api/review-quality/comments` — add `page`/`pageSize` query params, return paginated response with total count; add team-member filtering at the database query level
- **Database layer**: `getClassifiedComments()` in `src/db/comment-classifications.ts` — add LIMIT/OFFSET and team-member JOIN filtering
- **Frontend**: `CommentsTable` component — add pagination controls; `ReviewQualityContent` orchestrator — manage page state and pass pagination info
