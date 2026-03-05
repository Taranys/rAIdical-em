## Context

The application currently uses "Skills" as the sidebar label for the `/settings/categories` page and "Dimensions" for `/settings/dimensions`. These names are developer-centric and don't clearly communicate what these settings pages manage. The rename is purely cosmetic — only user-facing labels change, no routes, APIs, database schemas, or internal identifiers are affected.

## Goals / Non-Goals

**Goals:**
- Rename "Skills" to "Review Categories" in all user-facing locations (sidebar, page title, page subtitle)
- Rename "Dimensions" to "Competencies" in all user-facing locations (sidebar, page title, page subtitle)
- Update existing specs to reflect the new naming for consistency
- Update tests that assert on the old label text

**Non-Goals:**
- Changing URL routes (`/settings/categories`, `/settings/dimensions` stay as-is)
- Renaming database tables, columns, or API endpoints
- Renaming internal code identifiers (variable names, function names)
- Changing the underlying concept or behavior of either feature

## Decisions

### D1: Label-only rename, routes unchanged

Rename only the user-facing display text. The URL paths `/settings/categories` and `/settings/dimensions` remain unchanged since they already use reasonable slugs and changing routes would require redirect handling for bookmarks.

**Alternative considered:** Rename routes too (e.g., `/settings/review-categories`). Rejected because routes are internal concerns, the current slugs are fine, and route changes add unnecessary migration complexity.

### D2: Update test IDs to match new labels

The `data-testid` attributes in `ConfigStatusIndicator` currently use `status-skills` and `status-dimensions` (derived from `title.toLowerCase()`). After renaming, they will become `status-review categories` and `status-competencies`. Since test IDs should be stable identifiers, we will keep them derived from the new titles via `toLowerCase()`. The E2E and unit tests will need to update their selectors accordingly.

**Alternative considered:** Hardcode stable test IDs independent of the title. This would be cleaner, but the current pattern derives from `title.toLowerCase()` and changing the derivation pattern is out of scope.

## Risks / Trade-offs

- **[Low] Longer sidebar label**: "Review Categories" is longer than "Skills". At the current sidebar width, this should fit without issue, but should be visually verified.
- **[Low] Test breakage**: Tests that assert on the old text will fail until updated. Mitigated by updating all tests in the same change.
