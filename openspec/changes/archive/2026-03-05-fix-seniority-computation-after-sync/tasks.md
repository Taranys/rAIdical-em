## 1. Guard existing profiles in seniority computation

- [x] 1.1 In `src/lib/seniority-profile-service.ts`, add an early return in `computeSeniorityProfiles()` when all members have zero classified comments — skip `deleteAllProfiles()` and return `{ status: "success", membersProcessed: 0, profilesGenerated: 0, errors: 0 }`
- [x] 1.2 Move `deleteAllProfiles()` call to after data fetch succeeds and at least one member has comments (after line 188's filter, not at the top of the function)

## 2. Chain classification → seniority in sync pipeline

- [x] 2.1 In `src/lib/github-sync.ts`, refactor the post-sync block (lines 205-233) to chain classification and seniority sequentially: when auto-classify is enabled, `await classifyComments()` then call `computeSeniorityProfiles()` inside the same async IIFE
- [x] 2.2 When auto-classify is disabled but LLM is configured, still trigger `computeSeniorityProfiles()` independently (using existing classified data)
- [x] 2.3 When `getActiveClassificationRun()` returns an active run, skip both classification and seniority computation entirely

## 3. Tests

- [x] 3.1 Add unit test: `computeSeniorityProfiles()` returns early without deleting profiles when no classified comments exist
- [x] 3.2 Add unit test: `computeSeniorityProfiles()` deletes and recomputes when classified comments are available
- [x] 3.3 Add integration test: verify sync pipeline calls classification then seniority sequentially (mock both services, assert call order)
- [x] 3.4 Add integration test: verify sync skips seniority when classification fails
- [x] 3.5 Run full test suite to ensure no regressions
