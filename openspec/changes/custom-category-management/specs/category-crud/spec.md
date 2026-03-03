## ADDED Requirements

### Requirement: Custom categories database table
The system SHALL store custom categories in a `custom_categories` table with fields: `id` (PK auto-increment), `slug` (text unique, snake_case), `label` (text), `description` (text — LLM instruction), `color` (text, hex), `sortOrder` (integer), `createdAt` (text ISO), `updatedAt` (text ISO).

#### Scenario: Auto-seed on first access
- **WHEN** the `custom_categories` table is empty and a GET request is made to `/api/categories`
- **THEN** the system automatically inserts the 8 default categories (with slugs, labels, descriptions and colors) into the table and returns them

### Requirement: CRUD API for categories
The system SHALL expose API routes to manage custom categories:
- `GET /api/categories` — list all categories (auto-seeded if table is empty)
- `POST /api/categories` — create a new category
- `PUT /api/categories/:id` — update an existing category
- `DELETE /api/categories/:id` — delete a category

#### Scenario: List categories
- **WHEN** a GET request is made to `/api/categories`
- **THEN** the system returns categories from the `custom_categories` table sorted by `sortOrder` (auto-seeded if the table was empty)

#### Scenario: Create a category
- **WHEN** a POST request is made with `{ slug, label, description, color }`
- **THEN** the category is created with an auto-incremented `sortOrder` and the system returns the created category

#### Scenario: Create a category with duplicate slug
- **WHEN** a POST request is made with a `slug` that already exists
- **THEN** the system returns a 409 Conflict error

#### Scenario: Update a category
- **WHEN** a PUT request is made to `/api/categories/:id` with updated fields
- **THEN** the category is updated and the system returns the modified category

#### Scenario: Delete a category
- **WHEN** a DELETE request is made to `/api/categories/:id`
- **THEN** the category is removed from the table

#### Scenario: Reorder categories
- **WHEN** a PUT request is made to `/api/categories/reorder` with an array of IDs in the new order
- **THEN** the `sortOrder` of all categories is updated according to the provided order

### Requirement: Category management page
The system SHALL provide a `/settings/categories` page to manage categories.

#### Scenario: Display category list
- **WHEN** the user navigates to `/settings/categories`
- **THEN** the page displays the list of categories with for each: color swatch, label, slug, and description (truncated)

#### Scenario: Add a new category
- **WHEN** the user clicks "Add category" and fills the form (label, auto-generated slug, description, color)
- **THEN** the category is created via the API and appears in the list

#### Scenario: Edit a category
- **WHEN** the user clicks the edit button on a category
- **THEN** an inline form appears with current values, editable and saveable

#### Scenario: Delete a category with warning
- **WHEN** the user clicks the delete button on a category that has associated classifications
- **THEN** a confirmation dialog appears showing the number of comments classified in that category

#### Scenario: Drag-and-drop reordering
- **WHEN** the user reorders categories via drag-and-drop
- **THEN** positions are updated via the API and the order is reflected everywhere in the application

### Requirement: Reset to default categories
The system SHALL allow restoring the default categories.

#### Scenario: Reset button
- **WHEN** the user clicks "Reset to default categories"
- **THEN** a confirmation dialog appears, and if confirmed, all custom categories are deleted and the 8 default categories are re-inserted
