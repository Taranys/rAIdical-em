### Requirement: API supports paginated responses
The `GET /api/review-quality/comments` endpoint SHALL accept `page` (default: 1) and `pageSize` (default: 20) query parameters. The response SHALL include `comments` (array for the current page), `totalCount` (total matching comments), `page`, and `pageSize` fields.

#### Scenario: Default pagination
- **WHEN** a request is made without `page` or `pageSize` params
- **THEN** the API returns the first 20 comments, `page: 1`, `pageSize: 20`, and `totalCount` with the total number of matching comments

#### Scenario: Specific page requested
- **WHEN** a request is made with `page=2` and `pageSize=20`
- **THEN** the API returns comments 21-40, `page: 2`, `pageSize: 20`, and the correct `totalCount`

#### Scenario: Last page with fewer items
- **WHEN** there are 45 total comments and `page=3` is requested with `pageSize=20`
- **THEN** the API returns 5 comments, `page: 3`, `pageSize: 20`, and `totalCount: 45`

#### Scenario: Page beyond available data
- **WHEN** `page=10` is requested but only 15 total comments exist
- **THEN** the API returns an empty `comments` array, `page: 10`, `pageSize: 20`, and `totalCount: 15`

### Requirement: Pagination resets on filter or sort change
The frontend SHALL reset the current page to 1 whenever any filter value or sort column/order changes.

#### Scenario: Filter change resets page
- **WHEN** the user is on page 3 and changes the category filter
- **THEN** the table displays page 1 of the new filtered results

#### Scenario: Sort change resets page
- **WHEN** the user is on page 2 and clicks a sort column header
- **THEN** the table displays page 1 of the newly sorted results

### Requirement: Pagination UI controls
The table SHALL display pagination controls below the table body showing: a "Previous" button (disabled on page 1), a "Next" button (disabled on last page), and a text indicator showing "Page X of Y" where Y is the total number of pages.

#### Scenario: First page controls
- **WHEN** the user is on page 1 of 3
- **THEN** the Previous button is disabled, the Next button is enabled, and the indicator shows "Page 1 of 3"

#### Scenario: Last page controls
- **WHEN** the user is on page 3 of 3
- **THEN** the Previous button is enabled, the Next button is disabled, and the indicator shows "Page 3 of 3"

#### Scenario: Single page of results
- **WHEN** there are 15 or fewer total comments
- **THEN** the Previous and Next buttons are both disabled, and the indicator shows "Page 1 of 1"

### Requirement: Total count displayed in card header
The Classified Comments card header SHALL display the total number of matching comments alongside the title (e.g., "Classified Comments (45)").

#### Scenario: Total count shown
- **WHEN** the API returns `totalCount: 45`
- **THEN** the card title displays "Classified Comments (45)"
