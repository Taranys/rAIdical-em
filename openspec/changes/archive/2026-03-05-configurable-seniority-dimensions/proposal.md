## Why

Seniority dimensions are currently hardcoded in `src/lib/seniority-dimensions.ts` — 4 fixed technical dimensions and 4 fixed soft skill dimensions. Engineering managers have no way to customize which dimensions are tracked, meaning the radar chart and seniority profiles always show the same 8 axes regardless of what matters for their team. An EM managing a platform team may care about "observability" and "incident response" rather than "testing" and "pedagogy". This change lets the EM define the exact dimensions they want to analyze.

## What Changes

- Add a `seniorityDimensionConfigs` database table to store user-defined dimension configurations (name, family, description, sourceCategories for technical, enabled flag)
- Seed the table with the current 8 hardcoded dimensions as defaults on first migration
- Add a Settings UI section for managing seniority dimensions (add, edit, disable, reorder)
- Replace hardcoded `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS` arrays with DB-backed reads at computation and display time
- Update `computeSeniorityProfiles()` to read active dimensions from the database instead of constants
- Update `ALL_DEFINED_DIMENSION_NAMES` to be computed dynamically from DB-stored enabled dimensions
- Update radar chart and team profiles UI to render only the currently-enabled dimensions
- **BREAKING**: The exported constants `TECHNICAL_CATEGORY_DIMENSIONS`, `SOFT_SKILL_DIMENSIONS`, and `ALL_DEFINED_DIMENSION_NAMES` become dynamic — any code importing them directly will need to switch to the new DB-backed accessor functions

## Capabilities

### New Capabilities
- `dimension-config-storage`: Database table and data access layer for persisting user-defined seniority dimension configurations
- `dimension-settings-ui`: Settings page section allowing the EM to add, edit, disable, and reorder seniority dimensions
- `dynamic-dimension-resolution`: Runtime resolution of active dimensions from database, replacing hardcoded constants throughout computation and display

### Modified Capabilities
- `skills-only-profiles`: The filtering logic changes from checking against a hardcoded `ALL_DEFINED_DIMENSION_NAMES` set to checking against DB-stored enabled dimensions

## Impact

- **Database**: New `seniorityDimensionConfigs` table + migration with default seed data
- **API**: New `/api/settings/seniority-dimensions` CRUD endpoint; existing `/api/seniority-profiles/compute` and `/api/team-profiles` read dimensions from DB
- **UI**: New settings section under Settings page; radar chart and profiles adapt to configured dimensions
- **Computation**: `seniority-profile-service.ts` reads dimensions from DB; LLM soft skill prompt dynamically built from configured soft skill dimensions
- **Exports**: `seniority-dimensions.ts` retains types but exported constants are replaced with async accessor functions
