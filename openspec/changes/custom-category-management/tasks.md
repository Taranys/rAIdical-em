## 1. Database & Schema

- [ ] 1.1 Add `custom_categories` table to `src/db/schema.ts` (id, slug, label, description, color, sortOrder, createdAt, updatedAt)
- [ ] 1.2 Generate Drizzle migration (`npm run db:generate`) and apply it (`npm run db:migrate`)
- [ ] 1.3 Create DAL file `src/db/custom-categories.ts` with CRUD operations (getAll, create, update, delete, reorder, count by category) and auto-seed logic for the 8 default categories when the table is empty

## 2. API Routes

- [ ] 2.1 Create `src/app/api/categories/route.ts` — GET (list categories with auto-seed) and POST (create category)
- [ ] 2.2 Create `src/app/api/categories/[id]/route.ts` — PUT (update) and DELETE (delete)
- [ ] 2.3 Create `src/app/api/categories/reorder/route.ts` — PUT (reorder categories)
- [ ] 2.4 Create `src/app/api/categories/reset/route.ts` — POST (reset to default categories)
- [ ] 2.5 Create `src/app/api/categories/reclassify/route.ts` — POST (trigger batch reclassification)

## 3. Dynamic Classification

- [ ] 3.1 Modify `buildClassificationPrompt()` in `src/lib/llm/classifier.ts` to accept an optional `categories` parameter and build the prompt dynamically
- [ ] 3.2 Modify `classification-service.ts` to read custom categories from DB before running classification
- [ ] 3.3 Adapt `parseClassificationResponse()` to validate categories dynamically (not only the 8 hardcoded ones)
- [ ] 3.4 Implement reclassification logic: delete non-manual classifications + re-run batch

## 4. Dynamic Color Configuration

- [ ] 4.1 Create a `getCategoryConfig()` function in `src/lib/category-colors.ts` that returns config from DB or hardcoded fallback
- [ ] 4.2 Adapt `/api/review-quality/charts` API to use dynamic colors
- [ ] 4.3 Adapt Review Quality filter components to load categories dynamically

## 5. Settings / Categories Page

- [ ] 5.1 Create the `/settings/categories` page with layout (`src/app/settings/categories/page.tsx`)
- [ ] 5.2 Create the category list component with color swatch, label, slug and description
- [ ] 5.3 Create the add/edit category form (label, auto-generated slug, description textarea, color picker)
- [ ] 5.4 Implement drag-and-drop to reorder categories
- [ ] 5.5 Add "Reset to default categories" button with confirmation dialog
- [ ] 5.6 Add "Reclassify all comments" button with confirmation dialog and progress bar
- [ ] 5.7 Add deletion with confirmation dialog showing number of impacted comments

## 6. Navigation

- [ ] 6.1 Add "Categories" entry in the sidebar/navigation under the Settings section

## 7. Tests

- [ ] 7.1 Unit tests for DAL `custom-categories.ts` (CRUD, reorder, auto-seed)
- [ ] 7.2 Unit tests for `buildClassificationPrompt()` with custom categories
- [ ] 7.3 Unit tests for `parseClassificationResponse()` with dynamic categories
- [ ] 7.4 Integration tests for categories API routes (GET with auto-seed, POST, PUT, DELETE, reorder, reset)
- [ ] 7.5 E2E test: full flow — create categories + reclassification
