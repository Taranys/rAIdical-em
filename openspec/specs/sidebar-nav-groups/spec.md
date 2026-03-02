### Requirement: Sidebar displays two navigation groups
The sidebar SHALL display navigation items in two distinct groups: "Analyse" and "Configuration".

The "Analyse" group SHALL contain, in order: Dashboard, Review Quality, Team Profiles, 1:1 Prep.

The "Configuration" group SHALL contain, in order: Team, Sync, Settings.

#### Scenario: Two groups are visible in the sidebar
- **WHEN** the sidebar is displayed
- **THEN** two navigation groups are visible with labels "Analyse" and "Configuration"
- **AND** the "Analyse" group appears before the "Configuration" group

#### Scenario: Items are in the correct group
- **WHEN** the sidebar is displayed
- **THEN** Dashboard, Review Quality, Team Profiles, and 1:1 Prep are in the "Analyse" group
- **AND** Team, Sync, and Settings are in the "Configuration" group

### Requirement: Visual separator between groups
A visual separator SHALL be displayed between the "Analyse" and "Configuration" groups.

#### Scenario: Separator is visible between groups
- **WHEN** the sidebar is displayed
- **THEN** a separator element is rendered between the two navigation groups

### Requirement: Sync status indicator remains functional
The sync status indicator on the "Sync" item SHALL continue to function identically after the regrouping.

#### Scenario: Sync status emoji displays in Configuration group
- **WHEN** a sync operation is running
- **THEN** the Sync item in the "Configuration" group displays the running status emoji
