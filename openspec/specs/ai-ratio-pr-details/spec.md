### Requirement: API endpoint returns PR details per author
The system SHALL expose `GET /api/dashboard/ai-ratio/details` accepting `author`, `startDate`, and `endDate` query parameters. It SHALL return an array of individual PRs for that author within the date range, including their classification and reason.

#### Scenario: Successful request returns PR list
- **WHEN** a request is made with `author=alice&startDate=2025-01-01&endDate=2025-02-01`
- **THEN** the response SHALL be a JSON object `{ prs: [...] }` where each PR object contains `number`, `title`, `aiGenerated`, `classificationReason`, `createdAt`, and `state`

#### Scenario: Missing required parameters returns 400
- **WHEN** a request is made without `author` parameter
- **THEN** the response SHALL be status 400 with an error message

#### Scenario: No PRs found returns empty array
- **WHEN** a request is made for an author with no PRs in the date range
- **THEN** the response SHALL be `{ prs: [] }`

#### Scenario: PRs are sorted by creation date descending
- **WHEN** a request returns multiple PRs
- **THEN** the PRs SHALL be ordered from most recent to oldest

### Requirement: Expandable PR list per author in AI ratio chart
The system SHALL display a collapsible section below the AI ratio chart that shows individual PRs when a user clicks on an author's bar in the chart.

#### Scenario: Click on author bar opens detail panel
- **WHEN** the user clicks on an author's bar in the stacked bar chart
- **THEN** a collapsible panel SHALL open below the chart showing a list of that author's PRs

#### Scenario: PR list shows classification badge and reason
- **WHEN** the detail panel is open for an author
- **THEN** each PR row SHALL display: PR number (as link), title, a colored classification badge (ai/human/mixed/bot), and the classification reason text

#### Scenario: Null reason displays fallback message
- **WHEN** a PR has `classificationReason` as `null` (synced before this feature)
- **THEN** the system SHALL display "Raison non disponible — resynchroniser" as the reason

#### Scenario: Click on same author closes the panel
- **WHEN** the user clicks on the same author's bar that is already expanded
- **THEN** the collapsible panel SHALL close

#### Scenario: Click on different author switches the panel
- **WHEN** the user clicks on a different author's bar while one is already expanded
- **THEN** the panel SHALL close for the previous author and open for the newly selected author

#### Scenario: Loading state while fetching details
- **WHEN** the user clicks on an author's bar and data is being fetched
- **THEN** the system SHALL display a loading skeleton inside the collapsible panel
