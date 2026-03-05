## 1. Database Schema & Migration

- [ ] 1.1 Add `seniorityDimensionConfigs` table to Drizzle schema (`src/db/schema.ts`) with columns: id, name (unique), family, label, description, sourceCategories (nullable JSON text), isEnabled (integer default 1), sortOrder, createdAt, updatedAt
- [ ] 1.2 Generate Drizzle migration (`npm run db:generate`) and verify SQL includes the table creation and seed INSERT for the 8 default dimensions
- [ ] 1.3 Run migration (`npm run db:migrate`) and verify table exists with 8 default rows

## 2. Data Access Layer

- [ ] 2.1 Create `src/db/seniority-dimension-configs.ts` with DAL functions: `getAllDimensionConfigs()`, `getEnabledDimensionConfigs()`, `createDimensionConfig()`, `updateDimensionConfig()`, `deleteDimensionConfig()`, `reorderDimensionConfigs()`, `resetDimensionConfigsToDefaults()`
- [ ] 2.2 Write unit tests for the DAL (`src/db/seniority-dimension-configs.test.ts`) covering CRUD, reorder, reset, uniqueness constraint, and enabled filtering

## 3. Dynamic Dimension Resolution

- [ ] 3.1 Update `src/lib/seniority-dimensions.ts`: replace exported `TECHNICAL_CATEGORY_DIMENSIONS`, `SOFT_SKILL_DIMENSIONS`, and `ALL_DEFINED_DIMENSION_NAMES` constants with functions `getActiveTechnicalDimensions()`, `getActiveSoftSkillDimensions()`, and `getActiveDimensionNames()` that read from the DB via the DAL
- [ ] 3.2 Update `src/lib/seniority-profile-service.ts`: replace imports of hardcoded constants with calls to the new accessor functions
- [ ] 3.3 Update `src/app/api/team-profiles/route.ts`: use `getActiveDimensionNames()` for profile filtering instead of the hardcoded set
- [ ] 3.4 Update `src/app/team-profiles/seniority-radar-chart.tsx`: use dynamic dimension names from API response instead of hardcoded set
- [ ] 3.5 Update `src/app/team-profiles/team-profiles-content.tsx`: use dynamic dimension names from API response for filtering
- [ ] 3.6 Update existing tests in `src/lib/seniority-dimensions.test.ts` and `src/lib/seniority-profile-service.test.ts` to work with DB-backed dimensions (mock or in-memory DB setup)
- [ ] 3.7 Update `src/app/api/team-profiles/route.test.ts` to verify filtering uses DB-backed dimensions

## 4. Settings API Endpoints

- [ ] 4.1 Create `src/app/api/settings/seniority-dimensions/route.ts` with GET (list all) and POST (create) handlers
- [ ] 4.2 Create `src/app/api/settings/seniority-dimensions/[id]/route.ts` with PUT (update) and DELETE handlers
- [ ] 4.3 Create `src/app/api/settings/seniority-dimensions/reorder/route.ts` with PUT handler
- [ ] 4.4 Create `src/app/api/settings/seniority-dimensions/reset/route.ts` with POST handler
- [ ] 4.5 Write unit tests for all API endpoints covering success and validation error cases

## 5. Settings UI Page

- [ ] 5.1 Create `src/app/settings/dimensions/page.tsx` with the dimension management UI: list, add form, edit form, enable/disable toggle, delete with confirmation, reorder buttons, reset to defaults action
- [ ] 5.2 For technical dimensions, add a multi-select for `sourceCategories` that fetches available categories from `/api/categories`
- [ ] 5.3 Add "Dimensions" link to the sidebar navigation (update sidebar component)
- [ ] 5.4 Write component test for the dimensions settings page

## 6. Integration & Cleanup

- [ ] 6.1 Remove hardcoded default arrays from `seniority-dimensions.ts` (keep only types and DB-backed accessor functions)
- [ ] 6.2 Run full test suite (`npm test`) and fix any broken tests
- [ ] 6.3 Run lint (`npm run lint`) and fix any issues
- [ ] 6.4 Manual smoke test: verify Settings > Dimensions page works (add, edit, disable, delete, reorder, reset), then verify Team Profiles radar chart reflects configured dimensions after recomputation
