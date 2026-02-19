# US-2.17: Import Database

**Phase:** 2
**Epic:** Settings & Configuration
**Status:** In Progress

## Story

As an engineering manager, I want to import a complete SQLite database file from the Settings page, so that I can restore data from another environment or share state between machines.

## Dependencies

- ✅ [US-022: Database Schema Phase 1](./✅%20022-database-schema-phase1.md)
- ✅ [US-005: Configure GitHub PAT](./✅%20005-configure-github-pat.md)

## Acceptance Criteria

- [ ] A "Import Database" card is displayed at the bottom of the Settings page
- [ ] The card contains a file input accepting `.db`, `.sqlite`, `.sqlite3` files
- [ ] A red "Import Database" button triggers a confirmation dialog
- [ ] The confirmation dialog explicitly warns that ALL current data will be permanently replaced
- [ ] Clicking "Cancel" in the dialog closes it without any action
- [ ] Clicking "Replace Database" uploads the file and replaces the current database
- [ ] The uploaded file is validated as a valid SQLite file (magic bytes check)
- [ ] The uploaded file is validated for schema compatibility (required tables must exist)
- [ ] Drizzle migrations are applied to the imported database if needed
- [ ] Success feedback shows the number of rows per table imported
- [ ] Error feedback is displayed if the file is invalid or the schema is incompatible
- [ ] Unit tests cover the API route (valid file, invalid file, missing tables)
- [ ] Unit tests cover the UI component (dialog flow, upload, feedback)

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
- Closes current connection, copies new file to DB_PATH, reopens, runs migrations

**UI component:** `src/app/settings/database-import-form.tsx`
- Card with file input and red import button
- AlertDialog confirmation with explicit destructive warning
- Success/error feedback following existing Settings form patterns

### Implementation notes

_To be filled after implementation._
