# Plan 005: US-020 — Define AI Authorship Heuristic

## Summary

Configurable AI detection rules on the settings page plus a classification engine that tags PRs as `ai`, `human`, or `mixed`.

## Changes

### Schema Migration
- Changed `pullRequests.aiGenerated` from `integer (0/1)` to `text ("ai"/"human"/"mixed")`, default `"human"`
- Drizzle migration `0001_equal_tattoo.sql` with data migration (converts old `1` → `"ai"`, `0` → `"human"`)

### AI Detection Library (`src/lib/ai-detection.ts`)
- Types: `AiClassification`, `AiHeuristicsConfig`, `PrData`, `CommitData`
- Defaults: `DEFAULT_AI_HEURISTICS` with sensible pre-filled patterns
- `matchesGlob()`: Simple glob matching (only `*` wildcard, case-insensitive)
- `hasCoAuthorMatch()`: Parses `Co-Authored-By:` trailers and matches patterns
- `classifyPullRequest()`: Collects signals from enabled heuristics:
  - Any full AI signal (bot author, AI branch pattern, AI label) → `"ai"`
  - Partial co-author match (some commits, not all) → `"mixed"`
  - No signals → `"human"`

### API Route (`src/app/api/settings/ai-heuristics/route.ts`)
- `GET`: Returns stored config or defaults
- `PUT`: Validates config structure, saves as JSON in settings table
- `DELETE`: Removes config (resets to defaults on next GET)

### Settings UI (`src/app/settings/ai-heuristics-form.tsx`)
- Card with 4 heuristic sections, each with enable checkbox + comma-separated pattern input
- Save and Reset to Defaults buttons
- Success/error feedback messages

### Tests
- 32 unit tests for classification logic
- 8 unit tests for API route
- 10 unit tests for UI component
- 1 integration test for settings storage
- 2 E2E tests for settings page
