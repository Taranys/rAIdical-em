## Why

When an EM reviews a team member's seniority profile, they see maturity levels (junior/experienced/senior) for each dimension but have no explanation of *why* that level was assigned. This makes it hard to trust the assessment, prepare actionable 1:1 feedback, or identify specific areas for growth. Adding a human-readable rationale for each evaluation turns an opaque score into a coaching tool.

## What Changes

- **Generate a textual rationale** for each technical dimension maturity level during profile computation, explaining which metrics drove the classification (e.g., "Senior: depth score of 78/100 with 15 security-focused comments and a 45% high-value ratio exceeds all senior thresholds").
- **Expose `supportingMetrics` and rationale** through the team-profiles API endpoint (currently omitted from the response).
- **Display the rationale in the UI** — add an expandable detail section to each dimension in the seniority radar chart / team profile card, showing the rationale text and key supporting metrics.

## Capabilities

### New Capabilities
- `seniority-rationale-generation`: Generate a human-readable rationale string for each seniority dimension evaluation, covering both technical (threshold-based) and soft skill (LLM-assessed) dimensions.
- `seniority-rationale-display`: Expose rationale and supporting metrics in the API and display them in the team profiles UI with expandable per-dimension details.

### Modified Capabilities

## Impact

- `src/lib/seniority-profile-service.ts` — Add rationale generation logic for technical dimensions; soft skills already have `reasoning` from LLM.
- `src/db/seniority-profiles.ts` — No schema change needed; rationale stored inside existing `supportingMetrics` JSON field.
- `src/app/api/team-profiles/route.ts` — Include `supportingMetrics` in API response.
- `src/app/team-profiles/team-profiles-content.tsx` — Render expandable rationale per dimension.
- `src/app/team-profiles/seniority-radar-chart.tsx` — Potentially enhance tooltip or add click-to-expand behavior.
