## ADDED Requirements

### Requirement: Filters section is positioned at the top of the page
The Review Quality page SHALL render the filters section immediately below the page title, before the summary, charts, and comments sections.

#### Scenario: Page loads with filters at the top
- **WHEN** a user navigates to the Review Quality page
- **THEN** the filters section SHALL be the first interactive section visible below the page title
- **THEN** the summary, charts, and comments sections SHALL render below the filters

### Requirement: Period selector replaces manual date inputs
The filter bar SHALL include a PeriodSelector dropdown with preset date ranges instead of manual dateStart/dateEnd inputs. The available presets SHALL be: this-week, last-week, this-sprint, last-sprint, this-month, last-month, this-quarter, last-quarter.

#### Scenario: Default period is "this-month"
- **WHEN** the Review Quality page loads for the first time
- **THEN** the period selector SHALL display "This month" as the selected value
- **THEN** all data sections (summary, charts, comments) SHALL be filtered to the current month's date range

#### Scenario: User changes the period preset
- **WHEN** a user selects a different preset (e.g., "Last quarter") from the period dropdown
- **THEN** the summary, charts, and comments table SHALL reload with data filtered to the selected period's date range
- **THEN** the period selector SHALL display the newly selected preset label

### Requirement: Filter bar displays all controls in a single horizontal strip
The filter bar SHALL present period selector, category filter, reviewer filter, and confidence threshold on a single horizontal row, wrapping on smaller screens.

#### Scenario: All filter controls are visible together
- **WHEN** the user views the filter bar
- **THEN** the period selector, category dropdown, reviewer dropdown, and confidence input SHALL all be visible in a single horizontal row

### Requirement: MonthNavigator is removed from the comments card
The comments table card header SHALL no longer contain the MonthNavigator component. Date range is controlled exclusively by the period selector in the filter bar.

#### Scenario: Comments card header without month navigation
- **WHEN** the user views the classified comments section
- **THEN** the card header SHALL display only the title and count
- **THEN** there SHALL be no month navigation arrows or month label in the comments card header
