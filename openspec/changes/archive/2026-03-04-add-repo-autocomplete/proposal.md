## Why

The Settings > Repositories form currently uses plain text inputs for the Owner and Repository fields, forcing users to type exact values from memory. The codebase already has a `SearchableInput` component and a `GitHubRepoForm` that provide autocomplete powered by the GitHub API, but the `AddRepositoryForm` doesn't use them. Adding autocomplete will reduce input errors and improve the repository configuration experience.

## What Changes

- Replace the plain `Input` for Owner with a `SearchableInput` that suggests GitHub organizations and users accessible via the configured PAT
- Replace the plain `Input` for Repository with a `SearchableInput` that searches repositories under the selected owner via the GitHub API
- Reuse the existing `/api/settings/github-owners` and `/api/settings/github-repos` API endpoints (already used by `GitHubRepoForm`)
- Reuse the existing `SearchableInput` component with no modifications needed

## Capabilities

### New Capabilities
- `repo-autocomplete`: Autocomplete support for Owner and Repository fields in the Add Repository form, leveraging existing GitHub API endpoints and the SearchableInput component

### Modified Capabilities

## Impact

- `src/app/settings/add-repository-form.tsx`: Main file to modify — replace `Input` with `SearchableInput`, add state for suggestions and search
- No new API endpoints needed — reuse existing `/api/settings/github-owners` and `/api/settings/github-repos`
- No database changes
- No new dependencies
