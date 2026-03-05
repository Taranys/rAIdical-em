## Context

Seniority dimensions are hardcoded in `src/lib/seniority-dimensions.ts` as two constant arrays: 4 technical dimensions (security, architecture, performance, testing) mapped to comment classification categories, and 4 soft skill dimensions (pedagogy, cross_team_awareness, boldness, thoroughness) assessed by LLM. These constants are imported by the computation service, the API layer, and the UI components (radar chart, profile cards).

The project already has a pattern for user-configurable classification categories via the `customCategories` table + CRUD API + Settings UI (`/settings/categories`). This pattern (DB table, DAL, API routes, settings page) serves as the blueprint for configurable dimensions.

Key constraints:
- SQLite via better-sqlite3 (synchronous queries)
- Drizzle ORM for schema and queries
- Next.js App Router with Server Components
- The existing `customCategories` UI/API pattern should be followed for consistency

## Goals / Non-Goals

**Goals:**
- Allow the EM to define which seniority dimensions are tracked via a Settings UI
- Support both technical dimensions (with sourceCategories mapping) and soft skill dimensions
- Seed the database with the current 8 hardcoded dimensions as defaults
- Replace hardcoded constants with DB-backed reads throughout computation and display
- Allow enabling/disabling dimensions without deleting them (preserve historical profiles)

**Non-Goals:**
- Custom maturity thresholds per dimension (keep current fixed thresholds)
- Drag-and-drop reorder (use simple up/down buttons like categories)
- Import/export of dimension configurations
- Per-team-member dimension overrides (all members share the same dimension set)

## Decisions

### D1: New `seniorityDimensionConfigs` table (not reuse `settings` or `customCategories`)

**Choice**: Dedicated table with columns: `id`, `name` (unique slug), `family` (technical|soft_skill), `label` (display name), `description`, `sourceCategories` (JSON array, technical only), `isEnabled` (boolean), `sortOrder`, `createdAt`, `updatedAt`.

**Alternatives considered**:
- Storing in `settings` as JSON blob — rejected because it loses queryability and atomic updates
- Extending `customCategories` with a "dimension" type — rejected because categories and dimensions have different schemas (categories have color, dimensions have family and sourceCategories)

**Rationale**: Dedicated table mirrors the `customCategories` pattern, keeps schema clear, enables future indexing if needed.

### D2: Soft-delete via `isEnabled` flag rather than hard delete

**Choice**: Dimensions have an `isEnabled` column (default 1). Disabling a dimension excludes it from computation and display but preserves its configuration and existing profile data.

**Rationale**: Allows the EM to temporarily remove a dimension from the radar chart without losing historical profiles. Re-enabling restores it (profiles may need recomputation). Hard delete is available for dimensions that should be fully removed.

### D3: Auto-seed on first access (migration-time seeding)

**Choice**: The Drizzle migration creates the table and inserts the 8 default dimensions. A DAL function `getActiveDimensions()` reads from DB; if the table is empty (fresh install), it seeds defaults.

**Alternatives considered**:
- Seed via a separate API call — rejected because it requires user action
- Seed in the migration SQL only — chosen as primary approach, with fallback seed in DAL for robustness

**Rationale**: Follows the same pattern as `customCategories` auto-seeding.

### D4: Replace exported constants with async-compatible accessor functions

**Choice**: `seniority-dimensions.ts` keeps type exports (`SeniorityDimension`, `TechnicalCategoryDimension`) but replaces the constant arrays with functions:
- `getActiveTechnicalDimensions(): TechnicalCategoryDimension[]` — reads from DB
- `getActiveSoftSkillDimensions(): SeniorityDimension[]` — reads from DB
- `getActiveDimensionNames(): Set<string>` — returns enabled dimension names

Since better-sqlite3 is synchronous, these functions are synchronous too. No async change needed.

**Rationale**: Keeps the same call-site ergonomics (synchronous) while making the data source dynamic.

### D5: API design — single CRUD endpoint at `/api/settings/seniority-dimensions`

**Choice**: REST endpoint:
- `GET /api/settings/seniority-dimensions` — list all (includes disabled)
- `POST /api/settings/seniority-dimensions` — create new dimension
- `PUT /api/settings/seniority-dimensions/[id]` — update dimension
- `DELETE /api/settings/seniority-dimensions/[id]` — hard delete
- `PUT /api/settings/seniority-dimensions/reorder` — reorder
- `POST /api/settings/seniority-dimensions/reset` — reset to defaults

**Rationale**: Mirrors the `/api/categories` endpoint structure for consistency.

### D6: Settings UI as a dedicated sub-page `/settings/dimensions`

**Choice**: New page at `/settings/dimensions` following the same pattern as `/settings/categories` — list with edit/delete, add form, reorder buttons, reset to defaults action.

**Alternatives considered**:
- Inline section on the main settings page — rejected because dimension configuration is complex enough for its own page
- Combined page with categories — rejected to keep concerns separate

**Rationale**: Consistent with existing categories page pattern. Sidebar navigation already groups settings sub-pages.

### D7: Technical dimensions reference categories by slug

**Choice**: The `sourceCategories` field stores an array of category slugs (e.g., `["security"]`, `["architecture_design"]`). When the EM creates a technical dimension, they pick from existing `customCategories` slugs via a multi-select.

**Rationale**: Creates a clear link between comment classification categories and seniority dimensions. If a category is renamed, the dimension config references the slug which is stable.

## Risks / Trade-offs

- **[Stale profiles after dimension change]** → When the EM adds/removes/disables dimensions, existing seniority profiles may be stale. Mitigation: Show a "Recalculate" banner on the team profiles page when dimension config has changed since last computation (compare `updatedAt` timestamps). The existing "Recalculate" button already handles recomputation.

- **[Category-dimension mismatch]** → If the EM deletes a category that a technical dimension references, the dimension becomes orphaned. Mitigation: Validate `sourceCategories` on dimension save; warn in UI if referenced categories don't exist; silently skip orphaned mappings during computation.

- **[Migration for existing users]** → Users upgrading need their existing hardcoded dimensions seeded into the new table without losing profile data. Mitigation: Migration inserts the 8 defaults; existing `seniorityProfiles` rows reference dimension names which remain the same, so no data migration needed beyond the config table.

- **[LLM prompt size]** → Adding many soft skill dimensions increases the LLM prompt size. Mitigation: Keep a reasonable limit (suggest max 10 soft skills in UI). The LLM prompt builder already accepts a dynamic list.
