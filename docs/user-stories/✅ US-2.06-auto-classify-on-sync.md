# US-2.06: Auto-Classify New Comments on Sync

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As an engineering manager, I want newly synced review comments to be automatically classified so that I don't have to manually trigger classification after each sync.

## Dependencies

- ✅ [US-2.05: Batch Classify Comments](✅%20US-2.05-batch-classify-comments.md) — batch classification logic must exist
- ✅ [US-2.01: Configure LLM Provider](✅%20US-2.01-configure-llm-provider.md) — LLM must be configured
- ✅ [US-010: Fetch Pull Requests](✅%20010-fetch-pull-requests.md) — sync pipeline must exist

## Acceptance Criteria

- [x] After a GitHub sync completes (US-010/011/012), newly fetched comments are automatically queued for classification
- [x] Auto-classification is a settings toggle (default: enabled) in the AI/LLM settings section
- [x] The auto-classification runs as a background process after sync, not blocking the sync itself
- [x] A notification or indicator shows when auto-classification is running and when it completes
- [x] If no LLM provider is configured, auto-classification is silently skipped (no error)
- [x] Classification results appear on the dashboard without requiring a page refresh (or on next navigation)

## Plan and implementation details

**Goal:** Automatically trigger comment classification (via LLM) after each successful GitHub sync, with a settings toggle and a status indicator.

**Design decisions:**
- **Trigger location:** Inside `syncPullRequests()` after `completeSyncRun("success")` — simple, no event system needed.
- **Fire-and-forget:** `classifyComments()` is called without `await`, matching the existing sync pattern.
- **Default enabled:** Setting `auto_classify_on_sync` defaults to `"true"` when absent (checked via `!== "false"`).
- **Silent skip:** If LLM is not configured (missing provider/model/apiKey), the trigger silently skips.
- **Concurrency guard:** Checks `getActiveClassificationRun()` before starting to prevent double-runs.
- **Dashboard freshness:** No special mechanism needed — dashboard cards fetch fresh data on each navigation/period change.

**Implementation steps:**
1. Created `GET/PUT /api/settings/auto-classify` API endpoint for the toggle setting
2. Added auto-classification trigger in `syncPullRequests()` after successful sync completion
3. Created `useClassificationStatus` polling hook (pattern from `useSyncStatus`)
4. Added auto-classify toggle (Checkbox) in `LlmProviderForm` settings card
5. Added classification status indicator card on the Sync page
6. Updated all test files with new test cases

**Key files:**

| File | Action |
|------|--------|
| `src/app/api/settings/auto-classify/route.ts` | Created |
| `src/app/api/settings/auto-classify/route.test.ts` | Created |
| `src/lib/github-sync.ts` | Modified (auto-classify trigger) |
| `src/lib/github-sync.test.ts` | Modified (+7 tests) |
| `src/hooks/use-classification-status.ts` | Created |
| `src/app/settings/llm-provider-form.tsx` | Modified (toggle checkbox) |
| `src/app/sync/page.tsx` | Modified (classification status card) |
| `src/app/sync/page.test.tsx` | Modified (+4 tests) |
