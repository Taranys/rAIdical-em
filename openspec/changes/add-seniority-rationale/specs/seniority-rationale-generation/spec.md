## ADDED Requirements

### Requirement: Technical dimension rationale generation
The system SHALL generate a human-readable rationale string for each technical dimension maturity level evaluation. The rationale MUST explain which thresholds were met or not met, including the actual metric values.

#### Scenario: Senior-level technical dimension
- **WHEN** a technical dimension is evaluated with depthScore=78, volume=15, highValueRatio=0.45
- **THEN** the rationale MUST indicate that all senior thresholds are met, including the specific values: "depth score 78/100 (≥70), 15 comments (≥10), 45% high-value ratio (≥40%)"

#### Scenario: Experienced-level technical dimension
- **WHEN** a technical dimension is evaluated with depthScore=52, volume=7, highValueRatio=0.20
- **THEN** the rationale MUST indicate that experienced thresholds are met but senior thresholds are not, specifying which senior criteria failed: "depth score 52/100 (≥40) and 7 comments (≥5) meet experienced level. Missing senior: high-value ratio 20% (<40%)"

#### Scenario: Junior-level technical dimension
- **WHEN** a technical dimension is evaluated with depthScore=25, volume=3, highValueRatio=0.10
- **THEN** the rationale MUST indicate that experienced thresholds are not met, specifying which criteria failed: "depth score 25/100 (<40) and 3 comments (<5) — below experienced thresholds"

### Requirement: Soft skill rationale passthrough
The system SHALL use the existing LLM-generated `reasoning` field as the rationale for soft skill dimensions. No additional generation is needed.

#### Scenario: Soft skill dimension with LLM reasoning
- **WHEN** a soft skill dimension is evaluated and the LLM returns a reasoning string
- **THEN** the `rationale` field in `supportingMetrics` MUST contain the LLM reasoning text verbatim

#### Scenario: Soft skill dimension without LLM reasoning
- **WHEN** a soft skill dimension is evaluated and the LLM does not return a reasoning string
- **THEN** the `rationale` field MUST contain a fallback message indicating the score and maturity level: "Score: {llmScore}/100 → {maturityLevel}"

### Requirement: Rationale stored in supportingMetrics
The system SHALL store the rationale string as a `rationale` field inside the existing `supportingMetrics` JSON object for every seniority profile entry.

#### Scenario: Rationale persisted on profile computation
- **WHEN** seniority profiles are computed for a team member
- **THEN** every resulting profile entry MUST have a `rationale` string in its `supportingMetrics` JSON

### Requirement: Language dimension rationale generation
The system SHALL generate a human-readable rationale for per-language technical dimensions, following the same threshold-based template as category technical dimensions.

#### Scenario: Language dimension evaluated as experienced
- **WHEN** a TypeScript language dimension is evaluated with depthScore=55, volume=8, highValueRatio=0.25
- **THEN** the rationale MUST follow the same format as category technical dimensions, including the language name: "TypeScript — depth score 55/100 (≥40) and 8 comments (≥5) meet experienced level. Missing senior: high-value ratio 25% (<40%)"
