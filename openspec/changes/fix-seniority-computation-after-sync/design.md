## Context

After a successful GitHub sync, the pipeline triggers two async operations:

1. `classifyComments()` — LLM-based categorization of review comments (fire & forget)
2. `computeSeniorityProfiles()` — Computes maturity profiles from classified comments (fire & forget)

Both are launched independently in `github-sync.ts` (lines 205-233). The problem: seniority computation depends on classification results, but runs concurrently — not sequentially. Additionally, `computeSeniorityProfiles()` calls `deleteAllProfiles()` at the start, wiping existing data before potentially finding zero classified comments.

**Current flow:**
```
syncPullRequests() completes
  ├─ classifyComments().catch()          // async, takes minutes
  └─ computeSeniorityProfiles().catch()  // async, runs immediately with stale/no data
```

## Goals / Non-Goals

**Goals:**
- Seniority profiles are computed only after classification completes successfully
- Existing profiles are preserved if classification yields no new data
- The sync endpoint remains non-blocking (fire & forget pattern preserved)

**Non-Goals:**
- Changing the seniority computation algorithm itself
- Adding progress tracking or UI feedback for seniority computation
- Making classification synchronous with the sync response

## Decisions

### Decision 1: Chain classification → seniority sequentially

**Choice:** Await `classifyComments()` completion, then call `computeSeniorityProfiles()` in the same fire-and-forget wrapper.

**Rationale:** This is the simplest fix. The fire-and-forget pattern is already used — we just need to chain the two operations inside a single async block instead of launching them independently. No new infrastructure or callback mechanism needed.

**Alternative considered:** Event-based system (classification emits "done" event, seniority listens). Rejected — over-engineered for this use case, and introduces coupling between modules that currently have none.

### Decision 2: Guard deleteAllProfiles with data availability check

**Choice:** In `computeSeniorityProfiles()`, check that at least one classified comment exists before calling `deleteAllProfiles()`. If no classified comments are found, return early without deleting existing profiles.

**Rationale:** This protects against edge cases where classification fails silently or the LLM provider is misconfigured. Existing profiles (from a previous successful run) remain valid until new data replaces them.

**Alternative considered:** Move `deleteAllProfiles()` to after profile generation (delete old + insert new atomically). Rejected — current upsert pattern (delete + insert per profile) already handles individual updates, and wrapping everything in a transaction adds complexity without clear benefit for SQLite.

## Risks / Trade-offs

- **[Longer fire-and-forget chain]** → Classification + seniority now runs as one sequential async task. If classification takes 10 minutes, seniority starts 10 minutes later. This is acceptable since the user doesn't wait for either.
- **[Classification failure blocks seniority]** → If classification throws, seniority won't run. Mitigation: existing profiles are preserved (Decision 2), and user can manually trigger via POST `/api/seniority-profiles/compute`.
- **[No retry mechanism]** → If both fail, no automatic retry. Acceptable: user can re-sync or trigger manually. Adding retries is out of scope.
