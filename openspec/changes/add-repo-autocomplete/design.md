## Context

The Settings page has two forms that deal with GitHub repositories:
1. **GitHubRepoForm** (`github-repo-form.tsx`): The "Target Repository" card — already uses `SearchableInput` for both Owner and Repository fields with autocomplete powered by `/api/settings/github-owners` and `/api/settings/github-repos`.
2. **AddRepositoryForm** (`add-repository-form.tsx`): The "Repositories" card — uses plain `Input` components with no autocomplete.

Both forms serve different purposes (single target repo vs. multi-repo tracking), but the UX for entering owner/repo should be consistent. All the infrastructure (component, API endpoints) already exists.

## Goals / Non-Goals

**Goals:**
- Replace plain text inputs in `AddRepositoryForm` with `SearchableInput` autocomplete
- Reuse the existing `SearchableInput` component and API endpoints (`/api/settings/github-owners`, `/api/settings/github-repos`)
- Match the same interaction pattern used in `GitHubRepoForm`

**Non-Goals:**
- Modifying the `SearchableInput` component itself
- Creating new API endpoints
- Changing the repository add/validation logic (POST to `/api/repositories` remains the same)
- Modifying the `RepositoryList` or `RepositoriesCard` components

## Decisions

### 1. Reuse existing `SearchableInput` + API endpoints

**Decision:** Directly reuse `SearchableInput`, `/api/settings/github-owners`, and `/api/settings/github-repos` as-is.

**Rationale:** The `GitHubRepoForm` already implements the exact same autocomplete pattern we need. The API endpoints are generic (they query GitHub based on the configured PAT, not tied to any specific form). No need to create abstractions or shared hooks — the form is small and self-contained.

**Alternative considered:** Extract a shared hook (e.g., `useGitHubAutocomplete`) to DRY up the logic between `GitHubRepoForm` and `AddRepositoryForm`. Rejected because the two forms have different lifecycles and concerns — the duplication is minimal (fetch calls + state) and a shared hook would couple them unnecessarily.

### 2. Load owners on mount when PAT is configured

**Decision:** Fetch the owner list from `/api/settings/github-owners` when the component mounts and `isPatConfigured` is true, exactly like `GitHubRepoForm` does.

**Rationale:** Owners are loaded once and filtered client-side. This matches the existing UX pattern and avoids unnecessary API calls.

### 3. Debounced repo search on input change

**Decision:** Search repos via `/api/settings/github-repos?owner=X&q=Y` with a 300ms debounce when the user types in the repo field, matching `GitHubRepoForm`'s behavior.

**Rationale:** Server-side search via GitHub API provides accurate results. The 300ms debounce prevents excessive API calls. This is the established pattern.

### 4. Clear repo field and suggestions when owner changes

**Decision:** When the owner value changes, clear the repo field and repo suggestions, since repos are owner-scoped.

**Rationale:** Prevents stale repo suggestions from a previous owner appearing in the dropdown.

## Risks / Trade-offs

- **[Minimal code duplication]** → Acceptable: the fetch/state logic is ~30 lines duplicated from `GitHubRepoForm`. Extracting a hook would add complexity for marginal benefit. Can be refactored later if a third form appears.
- **[PAT required for autocomplete]** → Graceful degradation: if no PAT is configured, the `isPatConfigured` prop already disables the form. The autocomplete simply won't have data to show, matching existing behavior.
