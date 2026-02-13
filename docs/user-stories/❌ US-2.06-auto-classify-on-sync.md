# US-2.06: Auto-Classify New Comments on Sync

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As an engineering manager, I want newly synced review comments to be automatically classified so that I don't have to manually trigger classification after each sync.

## Dependencies

- ❌ [US-2.05: Batch Classify Comments](❌%20US-2.05-batch-classify-comments.md) — batch classification logic must exist
- 🏗️ [US-2.01: Configure LLM Provider](🏗️%20US-2.01-configure-llm-provider.md) — LLM must be configured
- 🏗️ [US-010: Fetch Pull Requests](🏗️%20010-fetch-pull-requests.md) — sync pipeline must exist

## Acceptance Criteria

- [ ] After a GitHub sync completes (US-010/011/012), newly fetched comments are automatically queued for classification
- [ ] Auto-classification is a settings toggle (default: enabled) in the AI/LLM settings section
- [ ] The auto-classification runs as a background process after sync, not blocking the sync itself
- [ ] A notification or indicator shows when auto-classification is running and when it completes
- [ ] If no LLM provider is configured, auto-classification is silently skipped (no error)
- [ ] Classification results appear on the dashboard without requiring a page refresh (or on next navigation)

## Plan and implementation details

_To be filled before implementation._
