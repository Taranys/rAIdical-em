## ADDED Requirements

### Requirement: Dynamic LLM prompt based on custom categories
The LLM classifier SHALL build the classification prompt using custom categories (if they exist) instead of hardcoded categories.

#### Scenario: Classification with custom categories
- **WHEN** custom categories exist and a comment is classified
- **THEN** the LLM prompt contains only the custom categories with their descriptions as classification instructions

#### Scenario: Classification without custom categories (fallback)
- **WHEN** no custom categories exist and a comment is classified
- **THEN** the LLM prompt uses the 8 hardcoded default categories (current behavior unchanged)

#### Scenario: Prompt format for custom categories
- **WHEN** the prompt is built with custom categories
- **THEN** each category appears as `- <slug>: <description>` and the expected response references the slug

### Requirement: Reclassification of all comments
The system SHALL allow re-running classification of all existing comments with the current categories.

#### Scenario: Trigger reclassification
- **WHEN** the user clicks "Reclassify all comments" on the `/settings/categories` page
- **THEN** a new `classification_run` is created, non-manual existing classifications are deleted, and batch classification is re-run

#### Scenario: Preserve manual classifications
- **WHEN** a reclassification is triggered and some comments have manual classifications (`isManual=1`)
- **THEN** those manual classifications are preserved and not recomputed

#### Scenario: Progress feedback
- **WHEN** a reclassification is in progress
- **THEN** the page displays a progress bar with the number of comments processed / total

### Requirement: Dynamic color and label adaptation
Display components (charts, filters, badges) SHALL use custom category colors and labels when they exist.

#### Scenario: Charts with custom categories
- **WHEN** custom categories are defined and the user views the Review Quality page
- **THEN** charts (donut, bar, trend) use custom category colors and labels

#### Scenario: Filters with custom categories
- **WHEN** custom categories are defined and the user uses Review Quality page filters
- **THEN** filter options reflect custom categories (labels and colors)
