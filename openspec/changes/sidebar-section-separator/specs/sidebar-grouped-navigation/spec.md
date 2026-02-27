## ADDED Requirements

### Requirement: Sidebar SHALL display navigation items in two distinct groups
The sidebar SHALL organize navigation items into two visually distinct groups with labeled headers:
- A "Dashboard" group containing: Dashboard, Review Quality, Team Profiles, 1:1 Prep
- A "Configuration" group containing: Team, Sync, Settings

Each group SHALL have its own `SidebarGroupLabel` header visible in expanded mode.

#### Scenario: Sidebar displays two labeled sections in expanded mode
- **WHEN** the sidebar is in expanded mode
- **THEN** the sidebar SHALL display a "Dashboard" group label followed by Dashboard, Review Quality, Team Profiles, and 1:1 Prep items
- **AND** a "Configuration" group label followed by Team, Sync, and Settings items

#### Scenario: Group labels are hidden in collapsed (icon-only) mode
- **WHEN** the sidebar is in collapsed icon-only mode
- **THEN** the group labels SHALL NOT be visible
- **AND** all navigation items SHALL still be displayed as icons with tooltips

### Requirement: Visual separation SHALL exist between navigation groups
The two navigation groups SHALL be visually separated so users can clearly distinguish between the Dashboard section and the Configuration section.

#### Scenario: Visual distinction between groups
- **WHEN** a user views the sidebar in expanded mode
- **THEN** there SHALL be visible spacing or separation between the last item of the Dashboard group and the first item of the Configuration group
- **AND** each group SHALL have its own distinct header label

### Requirement: Active state highlighting SHALL work across both groups
The active page highlighting SHALL continue to function correctly regardless of which group the active item belongs to.

#### Scenario: Active item in Dashboard group
- **WHEN** the user is on the Dashboard page
- **THEN** the Dashboard item in the Dashboard group SHALL be highlighted as active

#### Scenario: Active item in Configuration group
- **WHEN** the user is on the Settings page
- **THEN** the Settings item in the Configuration group SHALL be highlighted as active
