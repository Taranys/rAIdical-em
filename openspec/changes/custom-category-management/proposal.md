## Why

The 8 comment classification categories are currently hardcoded in `src/lib/llm/classifier.ts`. Every team and every engineering manager has different concerns — some want to track accessibility comments, others documentation, others technical debt. Being able to define custom categories (name + LLM instruction) and re-run classification allows the tool to adapt to each user's real context.

## What Changes

- New SQLite table `custom_categories` to store user-defined categories (slug, label, LLM description, color, sort order)
- New `/settings/categories` page with full CRUD interface to manage categories (add, edit, delete, reorder)
- API routes for category CRUD and reclassification triggering
- LLM classifier uses custom categories (when they exist) instead of hardcoded ones
- "Reclassify" button on the categories page to re-run classification of all comments with the new categories
- Existing pages (Review Quality, Team Profiles) dynamically adapt to user-defined categories

## Capabilities

### New Capabilities
- `category-crud`: Custom category management page — full CRUD with slug, label, LLM description, color and sort order
- `dynamic-classification`: LLM classifier uses custom categories instead of hardcoded ones, with ability to re-run classification

### Modified Capabilities
_No existing spec requirements are modified._

## Impact

- **Database**: New `custom_categories` table + Drizzle migration
- **Backend**: `src/lib/llm/classifier.ts` (dynamic prompt), `src/lib/category-colors.ts` (dynamic config), `src/lib/seniority-dimensions.ts` (dynamic mapping)
- **Frontend**: New `/settings/categories` page, adaptation of Review Quality and Team Profiles components to read categories from DB
- **API**: New routes `/api/categories` (CRUD) and `/api/categories/reclassify` (trigger)
