## Why

The current page names "Skills" and "Dimensions" are not self-explanatory for end users. "Skills" actually manages the categories used by the LLM to classify review comments, and "Dimensions" manages the competency axes used to assess team member seniority profiles. Renaming them to "Review Categories" and "Competencies" makes the navigation immediately understandable.

## What Changes

- Rename the "Skills" sidebar entry and page title to **"Review Categories"**
- Rename the "Dimensions" sidebar entry and page title to **"Competencies"**
- Update all existing specs that reference the old names to stay consistent

## Capabilities

### New Capabilities

- `rename-pages-labels`: Rename "Skills" to "Review Categories" and "Dimensions" to "Competencies" across the sidebar navigation, page titles, subtitles, status indicators, and any user-facing labels.

### Modified Capabilities

- `dimension-settings-ui`: Update spec references from "Dimensions" to "Competencies" in page title, navigation label, and UI descriptions.
- `sidebar-config-status`: Update spec references from "Skills"/"Dimensions" to "Review Categories"/"Competencies" in sidebar status indicators.
- `skills-only-profiles`: Update spec references from "Skills" terminology to "Review Categories" where applicable.
- `sidebar-nav-groups`: Update spec references for renamed navigation items.

## Impact

- **UI**: Sidebar navigation labels, page titles (`<h1>`), page subtitles, and status indicator test IDs
- **Tests**: Unit tests and E2E tests that assert on "Skills" or "Dimensions" text
- **Specs**: Four existing specs need terminology updates for consistency
- **No breaking changes**: Routes (`/settings/categories`, `/settings/dimensions`) remain unchanged. Database schema, API endpoints, and internal code identifiers are not affected.
