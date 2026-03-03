## Context

The seniority profile system currently computes maturity levels (junior/experienced/senior) for 8 dimensions (4 technical, 4 soft skills) plus per-language technical dimensions. The computation uses well-defined thresholds but the resulting level is stored without any explanation. The `supportingMetrics` JSON field contains raw numbers (depthScore, volume, highValueRatio, llmScore) but no human-readable rationale.

Soft skill dimensions already include a `reasoning` field from the LLM assessment. Technical dimensions lack any textual explanation — only numerical metrics are stored.

The API endpoint (`/api/team-profiles`) currently strips `supportingMetrics` entirely from the response.

## Goals / Non-Goals

**Goals:**
- Generate a concise, human-readable rationale for every seniority dimension evaluation
- Expose rationale and supporting metrics through the existing API
- Display rationale in the team profiles UI so EMs can understand and trust the assessments

**Non-Goals:**
- Changing maturity level thresholds or computation logic
- Adding LLM-generated rationale for technical dimensions (keep it deterministic and template-based)
- Changing the database schema (rationale fits inside existing `supportingMetrics` JSON)
- Adding rationale editing/override capabilities

## Decisions

### 1. Template-based rationale for technical dimensions

**Decision:** Generate rationale strings from templates using the existing metrics, rather than calling the LLM.

**Rationale:** Technical maturity levels are deterministic (threshold-based). A template like `"Senior: depth score {depthScore}/100, {volume} comments, {highValueRatio}% high-value ratio — all thresholds met"` is transparent and auditable. LLM-generated text would add latency, cost, and opacity for no benefit.

**Alternative considered:** LLM-generated rationale for technical dimensions. Rejected because the thresholds are simple enough to explain with templates, and deterministic rationale builds more trust.

### 2. Rationale stored in `supportingMetrics` JSON

**Decision:** Add a `rationale` string field inside the existing `supportingMetrics` JSON blob. No schema migration needed.

**Alternative considered:** Adding a dedicated `rationale` column to `seniority_profiles`. Rejected because it would require a migration for a single text field that naturally belongs with the other metrics.

### 3. Expose full `supportingMetrics` in API response

**Decision:** Include the entire `supportingMetrics` object (with rationale) in the `/api/team-profiles` response. Parse the JSON string server-side before returning.

**Alternative considered:** A separate `/api/seniority-rationale/:id` endpoint. Rejected — unnecessary complexity for data that's already available and lightweight.

### 4. Expandable detail UI pattern

**Decision:** Add a click-to-expand interaction on each dimension in the team profile card. When expanded, show the rationale text and key metrics (depthScore, volume, etc.). Re-use the existing `Collapsible` pattern from shadcn/ui.

**Alternative considered:** Tooltip on hover. Rejected — rationale text can be multi-sentence, and tooltips are hard to read on mobile.

## Risks / Trade-offs

- **[Rationale text can become stale]** → Rationale is regenerated every time profiles are recomputed, so it stays in sync with the data. No cache invalidation needed.
- **[API payload size increase]** → `supportingMetrics` adds ~200-300 bytes per dimension per member. For a team of 10 with ~12 dimensions each, that's ~36KB — negligible.
- **[Template-based rationale may feel rigid]** → The templates include the specific numbers that drove the decision, which makes them informative even if not as fluid as LLM text. Soft skills already have LLM reasoning.
