## Why

The project has undergone several name changes and the current name "rAIdical-em" no longer reflects the product vision. "EM Lighthouse" better conveys the tool's purpose: a guiding light (lighthouse) for Engineering Managers navigating team performance, review quality, and 1:1 preparation. This rename aligns branding across all touchpoints — UI, metadata, documentation, database, and configuration.

## What Changes

- Rename all UI-visible branding from "rAIdical-em" to "EM Lighthouse"
- Update `package.json` name to `em-lighthouse`
- Rename the SQLite database file from `rAIdical-em.db` to `em-lighthouse.db`
- Update all documentation references (README, vision, user stories, CLAUDE.md)
- Update the encryption key derivation string
- Update page metadata (title, description)
- Update test assertions that check for the old name
- **BREAKING**: Database file path changes from `data/rAIdical-em.db` to `data/em-lighthouse.db` — existing users must rename their database file manually or re-import

## Capabilities

### New Capabilities

- `project-branding`: Centralized project name and branding references updated to "EM Lighthouse" across the entire codebase

### Modified Capabilities

_None — this is a pure renaming change with no behavioral requirement modifications._

## Impact

- **Configuration**: `package.json`, `package-lock.json`, `drizzle.config.ts`
- **Database**: File path in `src/db/index.ts`, `src/db/health.ts`, `scripts/db-snapshot.mjs`
- **UI**: Sidebar title in `src/components/app-sidebar.tsx`, page metadata in `src/app/layout.tsx`
- **Security**: Encryption key derivation in `src/lib/crypto.ts` — changing this means existing encrypted values cannot be decrypted with the old key
- **Tests**: Unit tests (`app-sidebar.test.tsx`, route tests) and E2E tests (`navigation.spec.ts`)
- **Documentation**: `README.md`, `docs/vision.md`, `docs/github-issues-management.md`, `CLAUDE.md`, various user story files
- **API**: Error messages in database import route
