## Why

When clicking the "Import" button inside the GitHub import sheet to add selected members to a team, nothing happens. The button click appears to have no effect — no loading state, no API calls, no error messages. This blocks the core team member import workflow.

## What Changes

- Investigate and fix the root cause of the Import button not triggering the `handleImport` function in `ImportGitHubSheet`
- Ensure the import flow works end-to-end: button click triggers API calls, shows progress, displays results, and refreshes the team list
- Add error handling visibility so silent failures are surfaced to the user

## Capabilities

### New Capabilities

### Modified Capabilities
- `team-scoped-sync`: The import button behavior within the GitHub import sheet needs to be fixed to properly trigger member import

## Impact

- `src/app/team/import-github-sheet.tsx` — Import button click handler and import flow
- `src/components/ui/sheet.tsx` — Potential interaction issue with Radix Dialog-based Sheet and button events
- `src/app/api/team/route.ts` — POST endpoint (may need investigation if requests are silently failing)
- `src/app/team/import-github-sheet.test.tsx` — May need E2E-level test to catch runtime interaction bugs
