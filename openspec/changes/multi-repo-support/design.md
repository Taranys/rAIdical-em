## Context

rAIdical-em currently assumes a single GitHub repository, configured via the `settings` key-value table (`github_owner`, `github_repo`). All PR, review, and comment records are stored without any repository identifier. The sync flow targets one repo at a time, and all analytics queries implicitly aggregate over the single data source.

Engineering managers typically oversee teams contributing to 2-10 repositories. They need a unified dashboard with the ability to drill down per repo.

**Constraints:**
- SQLite database (no complex joins or cross-database queries)
- Drizzle ORM for schema and queries
- Existing data must be migrated (backfill a repositoryId column)
- The GitHub PAT may or may not have access to all repos — must handle per-repo

## Goals / Non-Goals

**Goals:**
- Support configuring and syncing multiple GitHub repositories
- Add a `repositoryId` foreign key to all data tables for per-repo tracking
- Provide an aggregate (all repos) view as the default dashboard experience
- Allow filtering dashboard metrics by a single repository
- Migrate existing data seamlessly (backfill with the currently configured repo)

**Non-Goals:**
- Multi-PAT support (one PAT per repo) — all repos share the same PAT for now
- Cross-repo PR correlation (e.g., PRs that span multiple repos)
- Repository groups or tagging
- Parallel sync of multiple repos (sequential is sufficient for v1)

## Decisions

### D1: New `repositories` table instead of extending settings

**Decision:** Create a dedicated `repositories` table with `id`, `owner`, `name`, `addedAt` columns. Deprecate the `github_owner` and `github_repo` settings keys.

**Rationale:** A proper table enables foreign keys, indexing, and clean relational queries. The settings key-value store is not suited for a list of entities.

**Alternatives considered:**
- JSON array in a settings key — fragile, no FK support, hard to query
- Separate SQLite database per repo — over-engineered, breaks cross-repo aggregation

### D2: Add `repositoryId` column to existing tables

**Decision:** Add a nullable `repositoryId` integer column (FK to `repositories.id`) to `pullRequests`, `reviews`, `reviewComments`, `prComments`, and `syncRuns`. Make it NOT NULL after migration backfill.

**Rationale:** This is the simplest approach that enables per-repo filtering on all queries. The column is nullable initially to allow a two-step migration (add column → backfill → set NOT NULL).

**Note on `syncRuns`:** This table already has a `repository` text column storing `"owner/repo"`. We'll add the `repositoryId` FK alongside it. The text column remains for human-readable display; the FK is used for joins and filters.

**Alternatives considered:**
- Separate tables per repo — breaks aggregate queries, complex schema management
- Junction table (PR ↔ repo) — unnecessary for a 1:1 relationship

### D3: Sequential sync per repo

**Decision:** When syncing, iterate over all configured repositories sequentially. Each repo gets its own `syncRun` entry. A "Sync All" action triggers syncs one by one.

**Rationale:** Sequential sync is simpler, avoids PAT rate limit contention, and is sufficient for the expected scale (2-10 repos). The UI already handles sync progress for a single run; extending to a list of runs is straightforward.

**Alternatives considered:**
- Parallel sync with Promise.all — risks hitting GitHub rate limits, complex error handling
- Background job queue — over-engineered for the current use case

### D4: App-level repo selector in root layout header

**Decision:** Place the `RepoSelector` dropdown in the root layout header (`src/app/layout.tsx`), next to the `SidebarTrigger`. The selected repository is stored as a `repo` query parameter in the URL. All pages (dashboard, sync, review quality, team profiles, etc.) read the `repo` param from the URL and pass it to their API calls. This avoids the user having to re-select a repository when navigating between pages.

**Rationale:** A single selector in the app shell provides a consistent, global filter. The query parameter approach is stateless, bookmarkable, and works with Server Components. Placing it in the root layout means every page inherits the filter automatically.

**Alternatives considered:**
- Per-page selector — requires re-selection on each navigation, poor UX
- React Context for repo state — adds client-side state complexity, not bookmarkable
- Cookie-based filter — not bookmarkable, harder to debug
- URL path segment (`/repo/123/dashboard`) — would require restructuring all routes

### D5: Migration strategy for existing data

**Decision:** Three-step migration:
1. Create `repositories` table
2. Add nullable `repositoryId` to data tables
3. Migration script reads current `github_owner`/`github_repo` from settings, creates the corresponding repository record, and backfills all existing rows

**Rationale:** This approach ensures zero data loss and works whether or not the user had a repo configured. If no repo was configured, the migration simply creates the table without backfilling.

## Risks / Trade-offs

- **[Data migration on large databases]** → SQLite ALTER TABLE + UPDATE can be slow on very large datasets. Mitigation: the expected dataset size (thousands of PRs, not millions) makes this acceptable. Add a console log for progress.
- **[Single PAT for all repos]** → The PAT must have access to all configured repos. Mitigation: verify repo access when adding a repo (existing verify endpoint). Document the limitation clearly. Multi-PAT is a future enhancement.
- **[Breaking change for API consumers]** → Adding `repositoryId` to API responses changes the shape. Mitigation: the app has no external API consumers; this is internal only.
- **[Index bloat]** → Adding `repositoryId` indexes to all data tables increases DB size. Mitigation: negligible for the expected scale, and required for performant per-repo queries.
