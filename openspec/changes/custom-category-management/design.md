## Context

Classification categories are currently hardcoded in `src/lib/llm/classifier.ts` (the `CommentCategory` type + `COMMENT_CATEGORIES` array + descriptions in the prompt). They are consumed by:
- `category-colors.ts` — colors and labels for display
- `seniority-dimensions.ts` — mapping categories to technical dimensions
- The LLM prompt in `buildClassificationPrompt()` — textual descriptions
- Review Quality and Team Profiles pages — filters, charts, radar

The user wants to define their own categories with a name and a description (LLM instruction), then re-run classification.

## Goals / Non-Goals

**Goals:**
- Allow the user to define custom categories via a dedicated page
- Each category has a slug, a display label, a description/instruction for the LLM, and a color
- The LLM classifier dynamically uses custom categories when they exist
- The user can re-run classification of all comments with the new categories
- Existing pages automatically adapt to the defined categories

**Non-Goals:**
- Multiple category sets (presets) — only one active set at a time
- Category version history
- Automatic migration of old classifications to new categories
- Per-team-member categories — categories are global

## Decisions

### 1. SQLite storage with `custom_categories` table

**Choice:** New Drizzle table `custom_categories` with fields: `id`, `slug` (unique, snake_case), `label`, `description`, `color` (hex), `sortOrder`, `createdAt`, `updatedAt`.

**Rationale:** Consistent with existing patterns (SQLite + Drizzle). The slug serves as a stable identifier for `comment_classifications.category`. The `sortOrder` lets the user control display order.

**Alternative rejected:** Storing in the `settings` table as JSON — less flexible for queries and indexes.

### 2. Auto-seed default categories

**Choice:** On the first `GET /api/categories` call, if the `custom_categories` table is empty, the system automatically inserts the 8 default categories (with their current slugs, labels, descriptions and colors). The user immediately sees the categories and can modify, delete, or add new ones.

**Rationale:** No friction at first launch — the user immediately has a manipulable set of categories. No "Initialize" button or fallback logic: a single source of truth (the DB table).

**Alternative rejected:** Displaying hardcoded categories as fallback with an "Initialize" button — adds complexity (two read paths) and an unnecessary manual action.

### 3. Batch reclassification

**Choice:** Reuse the existing `classification_runs` + `classification-service.ts` mechanism. The "Reclassify" button creates a new `classification_run`, deletes existing non-manual classifications, and re-runs the batch.

**Rationale:** Infrastructure already in place. Manual classifications (`isManual=1`) are preserved.

### 4. Dynamic LLM prompt

**Choice:** `buildClassificationPrompt()` accepts an optional `categories: CustomCategory[]` parameter. If provided, it builds the categories section of the prompt from this data instead of the hardcoded text.

**Rationale:** Minimal change to the classifier. The prompt format stays identical, only the category content changes.

### 5. Dynamic colors

**Choice:** `CATEGORY_CONFIG` becomes a function `getCategoryConfig()` that reads categories from the DB (always populated thanks to auto-seed). Client-side, colors are served by the API along with categories.

**Rationale:** Existing components (donut chart, bar chart, filters) continue working without interface changes — they just receive a different config.

### 6. Settings page

**Choice:** Route `/settings/categories` with an inline form (no modal). Category list with drag-and-drop for reordering, edit/delete buttons, and an add form at the bottom.

**Rationale:** Consistent pattern for a configuration page. Drag-and-drop makes reordering intuitive.

## Risks / Trade-offs

- **[Long reclassification]** — Reclassifying all comments can be slow (LLM calls). Mitigation: reuse the existing fire-and-forget mechanism with progress feedback.
- **[Deleted categories]** — If the user deletes a category that has classifications, historical data becomes orphaned. Mitigation: soft-delete or warning before deletion showing the number of affected comments.
- **[Broken seniority mapping]** — Technical seniority dimensions are mapped to hardcoded categories. Mitigation: for V1, seniority mapping stays on default categories. Adapting seniority mapping is a separate effort.
