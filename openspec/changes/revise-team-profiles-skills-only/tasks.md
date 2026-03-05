## 1. Export known dimensions set

- [ ] 1.1 Add `ALL_DEFINED_DIMENSION_NAMES` constant to `src/lib/seniority-dimensions.ts` — a `Set<string>` combining names from `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS`
- [ ] 1.2 Add unit test verifying `ALL_DEFINED_DIMENSION_NAMES` contains exactly the 8 expected dimension names

## 2. Remove per-language computation from service

- [ ] 2.1 Delete the per-language dimension computation block (lines 220–274) in `src/lib/seniority-profile-service.ts` — remove language counting, per-language depth score computation, and per-language `upsertSeniorityProfile` calls
- [ ] 2.2 Remove the `detectLanguage` import from `seniority-profile-service.ts`
- [ ] 2.3 Update existing unit tests in seniority profile service to verify no language dimensions are generated
- [ ] 2.4 Add a unit test confirming that `computeSeniorityProfiles()` only produces profiles with dimension names present in `ALL_DEFINED_DIMENSION_NAMES`

## 3. Filter UI to defined dimensions only

- [ ] 3.1 In `team-profiles-content.tsx`, filter `member.profiles` to only include profiles whose `dimensionName` is in `ALL_DEFINED_DIMENSION_NAMES` before passing to `SeniorityRadarChart` and `DimensionRow`
- [ ] 3.2 In `seniority-radar-chart.tsx`, filter incoming profiles against `ALL_DEFINED_DIMENSION_NAMES` as a safeguard
- [ ] 3.3 Handle edge case: when all profiles are filtered out, hide the radar chart and dimension list sections

## 4. Verification

- [ ] 4.1 Run full unit test suite (`npm test`) and verify all tests pass
- [ ] 4.2 Run lint (`npm run lint`) and fix any issues
