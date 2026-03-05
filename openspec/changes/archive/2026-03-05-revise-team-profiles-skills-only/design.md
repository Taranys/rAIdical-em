## Context

Team Profiles currently compute and display three categories of seniority dimensions:

1. **Technical category dimensions** — explicitly defined in `TECHNICAL_CATEGORY_DIMENSIONS` (security, architecture, performance, testing)
2. **Soft skill dimensions** — explicitly defined in `SOFT_SKILL_DIMENSIONS` (pedagogy, cross_team_awareness, boldness, thoroughness)
3. **Per-language dimensions** — auto-detected from file extensions via `detectLanguage()` (typescript, python, ruby, etc.)

The per-language dimensions were useful during prototyping but add noise to profiles. They don't represent curated competencies—they merely reflect which file types a reviewer happened to comment on. The user wants profiles to show only the intentionally defined skills.

The computation lives in `src/lib/seniority-profile-service.ts` (lines 220–274), where language counts are built from file paths and per-language profiles are upserted. The UI in `team-profiles-content.tsx` renders all profiles without filtering.

## Goals / Non-Goals

**Goals:**
- Remove per-language dimension computation from `computeSeniorityProfiles()`
- Ensure Team Profiles UI only displays dimensions from `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS`
- Clean up stale language profiles from the database on recomputation (already handled by `deleteAllProfiles()` at the start of computation)
- Remove now-unused `detectLanguage` import and related language-counting code from the service

**Non-Goals:**
- Removing `FILE_EXTENSION_TO_LANGUAGE` or `language-detection.ts` entirely — they may be used by other parts of the system (e.g., comment classification)
- Adding new dimensions or changing maturity level thresholds
- Modifying the soft skill LLM assessment logic
- Changing the API response shape — stale data simply won't be generated anymore

## Decisions

### Decision 1: Remove language computation at the source (service layer)

**Choice:** Delete the per-language computation block in `seniority-profile-service.ts` (lines 220–274) rather than filtering in the UI.

**Rationale:** Filtering at the UI would leave useless data in the database and waste computation time. Removing at the source is cleaner—no stale data is generated, and the `deleteAllProfiles()` call at recomputation start naturally purges old language profiles.

**Alternatives considered:**
- *UI-only filter*: Quick but leaves dead data in DB and wastes compute cycles
- *API-level filter*: Same issue—data still computed and stored needlessly

### Decision 2: Export a known-dimensions list for UI validation

**Choice:** Export an `ALL_DEFINED_DIMENSIONS` set from `seniority-dimensions.ts` combining technical category and soft skill dimension names. The UI can use this as a safeguard to filter only known dimensions.

**Rationale:** Belt-and-suspenders approach. Even though the service won't generate language profiles anymore, having the UI filter against known dimensions prevents any future regressions if someone adds a new dimension type without updating the UI.

### Decision 3: Remove unused imports after cleanup

**Choice:** Remove the `detectLanguage` import from `seniority-profile-service.ts` after deleting the language computation block.

**Rationale:** Dead imports fail linting and signal unmaintained code. The `language-detection.ts` module stays—only the import in the profile service is removed.

## Risks / Trade-offs

- **Existing language profiles disappear after next Recalculate** → Expected behavior. `deleteAllProfiles()` already runs before recomputation, so stale profiles are naturally cleaned up. No manual migration needed.
- **Language data loss** → The raw classified comments still retain file paths. Language data can be re-derived if needed in the future. This change only removes the aggregated seniority profiles.
- **UI briefly shows old language profiles until Recalculate** → Acceptable. Adding a UI-side filter (Decision 2) ensures they're hidden immediately even before recomputation.
