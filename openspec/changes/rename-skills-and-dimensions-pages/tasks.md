## 1. Sidebar Navigation Labels

- [ ] 1.1 Rename "Skills" to "Review Categories" in `CONFIG_ITEMS` array in `src/components/app-sidebar.tsx`
- [ ] 1.2 Rename "Dimensions" to "Competencies" in `CONFIG_ITEMS` array in `src/components/app-sidebar.tsx`
- [ ] 1.3 Update `ConfigStatusIndicator` title checks from `"Skills" || "Dimensions"` to `"Review Categories" || "Competencies"`

## 2. Page Titles and Subtitles

- [ ] 2.1 Update `<h1>` from "Skills" to "Review Categories" in `src/app/settings/categories/page.tsx`
- [ ] 2.2 Update subtitle from "Define the review skills..." to "Define the review categories used by the LLM to classify review comments." in `src/app/settings/categories/page.tsx`
- [ ] 2.3 Update `<h1>` from "Dimensions" to "Competencies" in `src/app/settings/dimensions/page.tsx`
- [ ] 2.4 Update subtitle from "Configure which seniority dimensions..." to "Configure which competencies are tracked for your team's review profiles." in `src/app/settings/dimensions/page.tsx`

## 3. Update Tests

- [ ] 3.1 Update unit tests in `src/app/settings/dimensions/page.test.tsx` to assert on "Competencies" instead of "Dimensions"
- [ ] 3.2 Update E2E tests in `e2e/categories.spec.ts` to use "Review Categories" instead of "Skills" where applicable
- [ ] 3.3 Update any sidebar-related tests that reference "Skills" or "Dimensions" labels

## 4. Update Existing Specs

- [ ] 4.1 Update `openspec/specs/dimension-settings-ui/spec.md`: rename "Dimensions" to "Competencies" in sidebar navigation requirement
- [ ] 4.2 Update `openspec/specs/sidebar-nav-groups/spec.md`: add "Review Categories" and "Competencies" to Configuration group items
- [ ] 4.3 Update `openspec/specs/sidebar-config-status/spec.md`: if any references to "Skills"/"Dimensions" labels exist, rename them

## 5. Verification

- [ ] 5.1 Run unit tests (`npm test`) and verify all pass
- [ ] 5.2 Run lint (`npm run lint`) and verify no errors
- [ ] 5.3 Visually verify sidebar labels and page titles display correctly
