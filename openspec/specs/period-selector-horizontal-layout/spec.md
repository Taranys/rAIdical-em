### Requirement: Date range label SHALL be displayed to the right of the period dropdown
The PeriodSelector component SHALL render the date range label (e.g., "Mar 1 – Mar 31, 2026") to the right of the dropdown selector, using a horizontal (row) layout instead of a vertical (column) layout.

#### Scenario: Label appears to the right of the dropdown
- **WHEN** the PeriodSelector component is rendered
- **THEN** the date range label MUST be positioned to the right of the dropdown selector in a horizontal layout

#### Scenario: Label updates when period changes
- **WHEN** the user selects a different period preset from the dropdown
- **THEN** the date range label to the right of the dropdown MUST update to reflect the new period's date range

### Requirement: Dropdown and label SHALL be vertically centered
The dropdown selector and the date range label SHALL be vertically aligned to center within the horizontal layout.

#### Scenario: Visual alignment
- **WHEN** the PeriodSelector component is rendered
- **THEN** the dropdown and the date range label MUST be vertically centered relative to each other
