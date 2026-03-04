## ADDED Requirements

### Requirement: API exposes supportingMetrics with rationale
The `/api/team-profiles` endpoint SHALL include the `supportingMetrics` object (parsed from JSON) for each profile in the response. The response MUST include the `rationale` field.

#### Scenario: API response includes supportingMetrics
- **WHEN** a client requests `GET /api/team-profiles`
- **THEN** each profile object in the response MUST contain a `supportingMetrics` object with at least a `rationale` string field

#### Scenario: API response with missing supportingMetrics in database
- **WHEN** a profile has a null or empty `supportingMetrics` in the database
- **THEN** the API MUST return `supportingMetrics: null` for that profile (no error)

### Requirement: Expandable rationale in team profile card
The team profiles UI SHALL display an expandable section for each dimension that shows the rationale and key supporting metrics.

#### Scenario: User clicks on a dimension to see rationale
- **WHEN** a user clicks on a dimension name or expand icon in a team member's profile card
- **THEN** the UI MUST expand to show the rationale text for that dimension

#### Scenario: Expanded dimension shows supporting metrics
- **WHEN** a dimension is expanded and has technical supporting metrics
- **THEN** the UI MUST display: depth score, comment volume, and high-value ratio alongside the rationale text

#### Scenario: Expanded soft skill dimension shows LLM reasoning
- **WHEN** a soft skill dimension is expanded
- **THEN** the UI MUST display the rationale (LLM reasoning) and the LLM score

#### Scenario: Dimension with no supportingMetrics
- **WHEN** a dimension has null supportingMetrics
- **THEN** the UI MUST display "No details available" instead of an expand control

### Requirement: Rationale visible in radar chart tooltip
The radar chart tooltip SHALL include a truncated rationale preview (first 100 characters) when hovering over a dimension data point.

#### Scenario: Hover on radar chart data point
- **WHEN** a user hovers over a dimension point on the radar chart
- **THEN** the tooltip MUST show: dimension name, maturity level, and first 100 characters of the rationale followed by "…" if truncated
