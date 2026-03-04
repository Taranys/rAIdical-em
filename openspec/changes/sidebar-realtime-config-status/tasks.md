## 1. Create SidebarStatusContext and Provider

- [ ] 1.1 Create `src/contexts/sidebar-status-context.tsx` with a React context providing `{ status: SidebarStatus, refresh: () => Promise<void> }`
- [ ] 1.2 Move state management from `useSidebarStatus` hook into a `SidebarStatusProvider` component that wraps the context provider
- [ ] 1.3 Export a `useSidebarStatusContext()` consumer hook that reads from the context
- [ ] 1.4 Keep the existing `useSidebarStatus` hook as a thin wrapper around the context for backward compatibility (or update all call sites)

## 2. Wire Provider into the app layout

- [ ] 2.1 Wrap the app layout in `src/app/layout.tsx` with `SidebarStatusProvider` so both sidebar and pages can access the context

## 3. Update sidebar to use context

- [ ] 3.1 Update `AppSidebar` in `src/components/app-sidebar.tsx` to consume `useSidebarStatusContext()` instead of `useSidebarStatus()` directly

## 4. Call refresh() after Settings page mutations

- [ ] 4.1 In `GitHubPatForm`: call `refresh()` after successful PAT save and after successful PAT delete
- [ ] 4.2 In `RepositoriesCard`: call `refresh()` after successful repository add and after successful repository remove
- [ ] 4.3 In `LlmProviderForm`: call `refresh()` after successful LLM config save and after successful LLM config delete

## 5. Call refresh() after Team page mutations

- [ ] 5.1 In Team page: call `refresh()` after successful team member add and after successful team member remove

## 6. Testing

- [ ] 6.1 Write unit tests for `SidebarStatusProvider` — verify `refresh()` triggers a re-fetch and updates status
- [ ] 6.2 Write unit tests verifying that sync polling is not disrupted by manual `refresh()` calls
- [ ] 6.3 Update existing `useSidebarStatus` tests if the hook API changed
- [ ] 6.4 Verify all existing tests pass with `npm test`
