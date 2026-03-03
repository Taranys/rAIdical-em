### Requirement: Period context is provided at the application root
The `PeriodProvider` SHALL wrap all page content at the root layout level, ensuring that any page can access the current period via `usePeriod()` without needing its own provider instance.

#### Scenario: Period state shared across navigation
- **WHEN** the user selects "last-quarter" on the Dashboard page and navigates to the 1:1 Preparation page
- **THEN** the 1:1 Preparation page SHALL display data for the "last-quarter" period without requiring the user to re-select it

#### Scenario: Default period on fresh load
- **WHEN** the application is loaded for the first time (or after a full page refresh)
- **THEN** the period SHALL default to "this-month"

### Requirement: Period selector is displayed in the global header
The `PeriodSelector` component SHALL be rendered in the application header bar (next to the sidebar trigger), visible on all pages.

#### Scenario: Period selector visible on Dashboard
- **WHEN** the user navigates to the Dashboard page
- **THEN** the period selector SHALL be visible in the global header

#### Scenario: Period selector visible on 1:1 Preparation
- **WHEN** the user navigates to the 1:1 Preparation page
- **THEN** the period selector SHALL be visible in the global header

#### Scenario: Period selector visible on other pages
- **WHEN** the user navigates to any page (Team, Settings, Review Quality, Sync)
- **THEN** the period selector SHALL be visible in the global header

### Requirement: Page-level period selectors are removed
Individual pages SHALL NOT render their own `PeriodSelector` or `PeriodProvider`. All period-dependent components SHALL consume the global context.

#### Scenario: Dashboard no longer wraps content in PeriodProvider
- **WHEN** the Dashboard page renders
- **THEN** it SHALL NOT instantiate its own `PeriodProvider` and SHALL consume the global one

#### Scenario: 1:1 Preparation no longer wraps content in PeriodProvider
- **WHEN** the 1:1 Preparation page renders
- **THEN** it SHALL NOT instantiate its own `PeriodProvider` and SHALL consume the global one

### Requirement: Period selector hidden during print
The global header (including the period selector) SHALL be hidden when the page is printed, consistent with the existing print behavior.

#### Scenario: Printing the 1:1 Preparation page
- **WHEN** the user prints the 1:1 Preparation page
- **THEN** the global header with the period selector SHALL NOT appear in the printed output
- **AND** the period label SHALL still be visible in the print-specific header of the page content
