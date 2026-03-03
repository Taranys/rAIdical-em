## 1. Rationale Generation Logic

- [ ] 1.1 Create a `generateTechnicalRationale(metrics: { depthScore, volume, highValueRatio }, maturityLevel, dimensionLabel?: string)` function in `src/lib/seniority-profile-service.ts` that returns a human-readable rationale string explaining which thresholds were met/not met with actual values
- [ ] 1.2 Add unit tests for `generateTechnicalRationale` covering senior, experienced, and junior levels, including edge cases at threshold boundaries
- [ ] 1.3 Update the language dimension computation loop to call `generateTechnicalRationale` and include the `rationale` field in `supportingMetrics`, prefixed with the language name
- [ ] 1.4 Update the category dimension computation loop to call `generateTechnicalRationale` and include the `rationale` field in `supportingMetrics`
- [ ] 1.5 Update the soft skill dimension loop to copy `score.reasoning` into a `rationale` field in `supportingMetrics`, with fallback to "Score: {llmScore}/100 → {maturityLevel}" when reasoning is absent
- [ ] 1.6 Add integration test verifying that after `computeSeniorityProfiles`, every profile entry has a `rationale` string in `supportingMetrics`

## 2. API Exposure

- [ ] 2.1 Update `src/app/api/team-profiles/route.ts` to include `supportingMetrics` (parsed from JSON) in each profile object of the response
- [ ] 2.2 Add API route test verifying that the response includes `supportingMetrics` with `rationale` for each profile

## 3. UI — Expandable Rationale in Team Profile Cards

- [ ] 3.1 Update the `SeniorityRadarChart` tooltip to show a truncated rationale preview (first 100 chars + "…") alongside dimension name and maturity level
- [ ] 3.2 Add an expandable dimension list below or alongside the radar chart in `team-profiles-content.tsx` using shadcn `Collapsible` — each row shows dimension name, maturity badge, and click-to-expand rationale with key metrics
- [ ] 3.3 Style the expanded view: rationale text in muted color, supporting metrics displayed as small pill/badges (depthScore, volume, highValueRatio for technical; llmScore for soft skills)
- [ ] 3.4 Handle null `supportingMetrics` gracefully — show "No details available" and hide the expand control
