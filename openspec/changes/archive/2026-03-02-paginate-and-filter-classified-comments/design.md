## Context

The Review Quality page displays a "Classified Comments" table that currently loads all matching comments into memory without pagination. The `getClassifiedComments()` function in `src/db/comment-classifications.ts` queries both `review_comments` and `pr_comments` tables, combines them in JavaScript, sorts them in JS, and returns the full array. The API route at `GET /api/review-quality/comments` forwards this array as-is.

Additionally, the table shows comments from any GitHub user present in the database, not just active team members. The sync layer already filters by team members during ingestion, but users who remove team members or import historical data may still see non-team comments.

## Goals / Non-Goals

**Goals:**
- Add server-side pagination with a fixed page size of 20 to the classified comments API and table
- Filter comments to only include those authored by active team members
- Provide clear pagination controls (previous/next, page indicator, total count)

**Non-Goals:**
- Configurable page size (fixed at 20)
- Infinite scroll or virtual scrolling
- Client-side pagination (we do server-side to keep the response small)
- Changing the existing filter bar or sort behavior (pagination integrates with them)

## Decisions

### 1. Server-side pagination with JS-level slicing

**Decision:** Keep the current two-query-then-combine-in-JS approach, but add counting and slicing.

**Rationale:** The current architecture queries `review_comments` and `pr_comments` separately then merges/sorts in JavaScript. Moving to a SQL UNION + LIMIT/OFFSET would require significant refactoring of the Drizzle query builder usage. Since the dataset per month is bounded (typically hundreds of comments, not tens of thousands), slicing in JS after sort is efficient enough.

**Approach:**
1. `getClassifiedComments()` gains optional `page` and `pageSize` params
2. After combining and sorting both result sets, apply `slice((page-1)*pageSize, page*pageSize)`
3. Return `{ comments, totalCount, page, pageSize }`

**Alternative considered:** SQL UNION ALL + ORDER BY + LIMIT/OFFSET — rejected because Drizzle ORM doesn't natively support UNION well, and the two-table pattern is deeply embedded.

### 2. Team-member filtering via INNER JOIN

**Decision:** Replace the LEFT JOINs indirectly by adding a WHERE condition that filters on active team member usernames fetched from the `team_members` table.

**Rationale:** The sync layer already uses `getActiveTeamMemberUsernames()` to filter during ingestion. We reuse the same function at query time. This is consistent and simple. When no team members exist (empty team), we show all comments (backward compatible).

**Approach:**
1. At the start of `getClassifiedComments()`, load active team member usernames
2. If the set is non-empty, add `WHERE reviewer IN (...)` / `WHERE author IN (...)` conditions
3. The existing per-reviewer filter (`filters.reviewer`) still works — it just further narrows within the team

### 3. Pagination UI with simple previous/next controls

**Decision:** Use a simple previous/next + page indicator below the table. Reset to page 1 when filters or sort change.

**Rationale:** KISS — matches the project's design philosophy. A full page-number bar is unnecessary for 20-item pages.

## Risks / Trade-offs

- **[JS slicing not optimal for huge datasets]** → Acceptable because monthly data is bounded. Can migrate to SQL-level pagination later if needed.
- **[Page reset on filter/sort change]** → Better UX than showing an out-of-range page. Users expect to go back to page 1 when changing filters.
- **[Team filter removes individual reviewer filter value]** → If a user manually filters by "reviewer X" who is not a team member, they'll see no results. This is expected since the goal is to restrict to team members only.
