## 1. Add status callbacks to card components

- [x] 1.1 Add `onConfiguredChange` callback prop to `RepositoriesCard` that reports whether `repositories.length > 0`
- [x] 1.2 Add `onConfiguredChange` callback prop to `LlmProviderForm` that reports `isConfigured` state changes

## 2. Centralize configuration state in settings page

- [x] 2.1 Add `isReposConfigured` and `isLlmConfigured` state variables in `SettingsPage`
- [x] 2.2 Wire up `onConfiguredChange` callbacks from `RepositoriesCard` and `LlmProviderForm` to the new state variables
- [x] 2.3 Create a helper function `getCardStatusClasses(isConfigured: boolean | undefined)` that returns the appropriate Tailwind class string: green classes when `true`, orange classes when `false`, empty string when `undefined` (loading)

## 3. Apply status colors to cards

- [x] 3.1 Pass computed className to `GitHubPatForm` wrapper — wrap in a `<div>` or pass className prop to its `<Card>` (add `className` prop to `GitHubPatForm` if needed)
- [x] 3.2 Pass computed className to `RepositoriesCard` `<Card>` via a new `className` prop
- [x] 3.3 Pass computed className to `LlmProviderForm` `<Card>` via a new `className` prop
- [x] 3.4 Verify `DatabaseImportForm` and `DatabaseResetForm` cards retain default `bg-card` styling (no changes needed)

## 4. Testing

- [x] 4.1 Write unit tests for the `getCardStatusClasses` helper function
- [x] 4.2 Write component tests verifying green background when `isConfigured` is true for each card
- [x] 4.3 Write component tests verifying orange background when `isConfigured` is false for each card
- [x] 4.4 Verify existing tests still pass with `npm test`
