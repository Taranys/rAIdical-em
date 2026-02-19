# US-2.17: Import Database

**Phase:** 2
**Epic:** Settings & Configuration
**Status:** Done

## Story

As an engineering manager, I want to import a complete SQLite database file from the Settings page, so that I can restore data from another environment or share state between machines.

## Dependencies

- ✅ [US-022: Database Schema Phase 1](./✅%20022-database-schema-phase1.md)
- ✅ [US-005: Configure GitHub PAT](./✅%20005-configure-github-pat.md)

## Acceptance Criteria

- [x] A "Import Database" card is displayed at the bottom of the Settings page
- [x] The card contains a file input accepting `.db`, `.sqlite`, `.sqlite3` files
- [x] A red "Import Database" button triggers a confirmation dialog
- [x] The confirmation dialog explicitly warns that ALL current data will be permanently replaced
- [x] Clicking "Cancel" in the dialog closes it without any action
- [x] Clicking "Replace Database" uploads the file and replaces the current database
- [x] The uploaded file is validated as a valid SQLite file (magic bytes check)
- [x] The uploaded file is validated for schema compatibility (required tables must exist)
- [x] Success feedback shows the number of rows per table imported
- [x] Error feedback is displayed if the file is invalid or the schema is incompatible
- [x] Unit tests cover the API route (valid file, invalid file, missing tables)
- [x] Unit tests cover the UI component (dialog flow, upload, feedback)
- [x] Integration test proves data is accessible via DAL and Proxy after replaceDatabase()

## Plan and implementation details

### Implementation plan

**API route:** `POST /api/settings/database/import`
- Receives SQLite file via `FormData`
- Validates magic bytes (`SQLite format 3\0`)
- Opens with `better-sqlite3` in read-only, checks required tables via `sqlite_master`
- Calls `replaceDatabase()` to swap the active DB
- Returns row counts per table on success

**Database layer:** `src/db/index.ts`
- Add `replaceDatabase(newFilePath: string)` function
- Closes current connection, cleans WAL/SHM files, copies new file to DB_PATH, reopens

**UI component:** `src/app/settings/database-import-form.tsx`
- Card with file input and red import button
- AlertDialog confirmation with explicit destructive warning
- Success/error feedback following existing Settings form patterns

### Implementation notes

**Files created:**
- `src/app/api/settings/database/import/route.ts` — API route (POST)
- `src/app/api/settings/database/import/route.test.ts` — 5 unit tests
- `src/app/settings/database-import-form.tsx` — UI component
- `src/app/settings/database-import-form.test.tsx` — 11 unit tests
- `src/db/replace-database.integration.test.ts` — 1 integration test

**Files modified:**
- `src/db/index.ts` — Added `replaceDatabase()`, `DB_PATH` export, Proxy pattern for `db`/`sqlite` exports
- `src/app/settings/page.tsx` — Integrated `DatabaseImportForm`

**Key decisions:**
- **No `migrate()` in `replaceDatabase()`**: Drizzle migrations are not idempotent (`CREATE TABLE` without `IF NOT EXISTS`), so replaying them against an imported DB with existing tables would fail and destroy data. The imported DB is already validated for schema compatibility.
- **Proxy pattern for `db`/`sqlite` exports**: ESM imports capture values at import time. A Proxy with bound methods delegates to a mutable `_state` container so all consumers see the new connection after replacement.
- **WAL/SHM cleanup**: Stale WAL/SHM files from the old connection are removed before copying the new file to prevent the new connection from inheriting leftover state.
