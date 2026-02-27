## ADDED Requirements

### Requirement: GitHub import button displays GitHub icon
The "Import from GitHub" button SHALL display the GitHub icon (lucide-react `Github`) to the left of the button text.

#### Scenario: Icon is visible alongside text
- **WHEN** the Team Members page is loaded
- **THEN** the "Import from GitHub" button displays the GitHub icon to the left of the text "Import from GitHub"

### Requirement: GitHub import button uses branded colors
The "Import from GitHub" button SHALL use a dark background color (`#24292e`) with white text to reflect GitHub branding.

#### Scenario: Button displays with GitHub colors
- **WHEN** the Team Members page is loaded
- **THEN** the "Import from GitHub" button has a dark background and white text

#### Scenario: Button hover state
- **WHEN** the user hovers over the "Import from GitHub" button
- **THEN** the button background becomes slightly lighter to indicate interactivity

### Requirement: GitHub import button preserves existing behavior
The styled button SHALL maintain its existing click behavior (opening the GitHub import sheet).

#### Scenario: Button opens import sheet
- **WHEN** the user clicks the styled "Import from GitHub" button
- **THEN** the GitHub import sheet opens as before
