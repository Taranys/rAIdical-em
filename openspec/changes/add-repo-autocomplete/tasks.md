## 1. Refactor AddRepositoryForm to use SearchableInput

- [ ] 1.1 Import `SearchableInput` and add state for owners list, repos list, search loading, and debounce ref in `add-repository-form.tsx`
- [ ] 1.2 Add `loadOwners` effect that fetches `/api/settings/github-owners` on mount when `isPatConfigured` is true
- [ ] 1.3 Add `searchRepos` function with 300ms debounce that fetches `/api/settings/github-repos?owner=X&q=Y`
- [ ] 1.4 Replace the Owner `Input` with `SearchableInput` using owner suggestions (showAllOnFocus, client-side filtering by login)
- [ ] 1.5 Replace the Repository `Input` with `SearchableInput` using repo search results (server-side filtering, show name/private badge/description)
- [ ] 1.6 Add logic to clear repo field and repo suggestions when owner changes

## 2. Testing

- [ ] 2.1 Write unit tests for the updated `AddRepositoryForm` covering: owner autocomplete display, repo search on input, owner change clears repo, repo field disabled without owner
