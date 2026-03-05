## Why

After a GitHub sync, seniority profiles are never correctly computed because `computeSeniorityProfiles()` runs **concurrently** with `classifyComments()` instead of **after** it completes. Since seniority computation depends on classified comments, it either finds no data (first sync) or stale data (subsequent syncs), and worse, it deletes all existing profiles before recomputing from incomplete data. The result: team members have no seniority profiles visible in the UI.

## What Changes

- **Fix execution order**: `computeSeniorityProfiles()` must run only after `classifyComments()` has completed successfully, not in parallel with it.
- **Add completion callback pattern**: Classification service should signal completion so the sync pipeline can chain seniority computation after it.
- **Preserve existing profiles on failure**: If classification fails or yields no data, existing seniority profiles should not be deleted.

## Capabilities

### New Capabilities

- `seniority-after-classification`: Ensure seniority profile computation is triggered only after comment classification completes, with proper error handling and data preservation.

### Modified Capabilities

(none)

## Impact

- `src/lib/github-sync.ts` — Change the fire-and-forget pattern to chain classification → seniority computation sequentially.
- `src/lib/seniority-profile-service.ts` — Guard `deleteAllProfiles()` to only run when new data is available.
- `src/lib/classification-service.ts` — No structural changes needed, but its async completion becomes a dependency for seniority computation.
- Existing tests for sync, classification, and seniority computation may need updates.
