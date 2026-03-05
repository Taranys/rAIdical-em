## ADDED Requirements

### Requirement: Sidebar displays "Review Categories" label for categories page
The sidebar navigation SHALL display "Review Categories" as the label for the `/settings/categories` link.

#### Scenario: Review Categories label visible in sidebar
- **WHEN** the sidebar is displayed
- **THEN** the Configuration group contains a link labeled "Review Categories" pointing to `/settings/categories`

### Requirement: Sidebar displays "Competencies" label for dimensions page
The sidebar navigation SHALL display "Competencies" as the label for the `/settings/dimensions` link.

#### Scenario: Competencies label visible in sidebar
- **WHEN** the sidebar is displayed
- **THEN** the Configuration group contains a link labeled "Competencies" pointing to `/settings/dimensions`

### Requirement: Categories page title reads "Review Categories"
The `/settings/categories` page SHALL display "Review Categories" as its main heading (`<h1>`).

#### Scenario: Page heading on categories page
- **WHEN** the EM navigates to `/settings/categories`
- **THEN** the page heading reads "Review Categories"

### Requirement: Categories page subtitle uses "review categories" terminology
The `/settings/categories` page subtitle SHALL read "Define the review categories used by the LLM to classify review comments."

#### Scenario: Page subtitle on categories page
- **WHEN** the EM navigates to `/settings/categories`
- **THEN** the subtitle reads "Define the review categories used by the LLM to classify review comments."

### Requirement: Dimensions page title reads "Competencies"
The `/settings/dimensions` page SHALL display "Competencies" as its main heading (`<h1>`).

#### Scenario: Page heading on dimensions page
- **WHEN** the EM navigates to `/settings/dimensions`
- **THEN** the page heading reads "Competencies"

### Requirement: Dimensions page subtitle uses "competencies" terminology
The `/settings/dimensions` page subtitle SHALL read "Configure which competencies are tracked for your team's review profiles."

#### Scenario: Page subtitle on dimensions page
- **WHEN** the EM navigates to `/settings/dimensions`
- **THEN** the subtitle reads "Configure which competencies are tracked for your team's review profiles."
