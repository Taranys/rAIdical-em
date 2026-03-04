## Context

The `ImportGitHubSheet` component allows EMs to search or browse GitHub users/org members and import them as team members. The flow is:

1. User opens the sheet via "Import from GitHub" button on the Team page
2. User searches or browses for GitHub users
3. User selects members via checkboxes
4. User clicks "Import X members" button in the sheet footer
5. The `handleImport` async function POSTs each username to `/api/team`
6. Results are displayed and the team list refreshes

The bug report states that clicking Import does nothing — no loading state, no API calls, no visible feedback.

### Current Implementation

- `import-github-sheet.tsx`: The Import button in `SheetFooter` calls `handleImport` directly via `onClick={handleImport}`
- The `Sheet` component wraps Radix UI's `Dialog` primitive (`Dialog as SheetPrimitive` from `radix-ui`)
- `handleImport` is an async function that sets loading state, loops through selected users, makes fetch calls, and updates results
- Unit tests pass because they mock `fetch` and simulate clicks in jsdom, which doesn't reproduce the actual Radix Dialog behavior

### Investigation Findings

The `Sheet` component uses `Dialog` from Radix UI. Radix Dialog's `Content` component may intercept pointer events or close the dialog on certain interactions. The button in `SheetFooter` sits inside `SheetPrimitive.Content` (which is `Dialog.Content`). The key investigation areas are:

1. **Event propagation**: Whether Radix Dialog intercepts the button click event
2. **Focus management**: Whether Radix Dialog's focus trap interferes with the button
3. **Async handler**: Whether the async nature of `handleImport` causes any issue with React's synthetic event system
4. **Silent fetch failures**: Whether API calls are made but fail silently without updating state

## Goals / Non-Goals

**Goals:**
- Fix the Import button so clicking it triggers the import flow reliably
- Ensure proper error visibility if the import fails for any reason
- Validate the fix works in actual browser runtime (not just jsdom tests)

**Non-Goals:**
- Refactoring the import sheet architecture
- Changing the import API behavior
- Adding new import capabilities

## Decisions

### Decision 1: Investigate and fix button click handler interaction

**Approach**: Debug the actual runtime behavior by:
1. Adding `console.log` at the start of `handleImport` to verify it's being called
2. Checking browser DevTools Network tab for outgoing requests
3. Testing with `type="button"` explicitly on the Import button to prevent any form submission behavior
4. Wrapping the async handler to catch and surface errors

**Rationale**: The most likely causes are:
- An unhandled promise rejection silently swallowing errors
- Radix Dialog event handling interfering with the button click
- A state issue where `selectedCount === 0` evaluates differently at runtime

### Decision 2: Add explicit error boundary for import operations

**Approach**: Wrap the `handleImport` call with try/catch at the onClick level and add a visible error state if the entire operation fails unexpectedly.

**Rationale**: Currently, if `handleImport` throws before the fetch loop (e.g., during `Array.from(selected)`), the error is silently swallowed as an unhandled promise rejection. The user sees nothing.

## Risks / Trade-offs

- **[Low certainty on root cause]**: The exact root cause needs runtime debugging. The fix may require iterative investigation. Mitigation: Start with the most likely causes and add defensive error handling regardless.
- **[Test gap]**: Unit tests in jsdom don't reproduce Radix Dialog's actual DOM behavior. Mitigation: Add an E2E test that validates the import flow in a real browser.
