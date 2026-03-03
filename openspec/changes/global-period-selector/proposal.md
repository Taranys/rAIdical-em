## Why

The Period Selector is currently instantiated independently on each page (Dashboard and 1:1 Preparation) via a local `PeriodProvider`. When the user changes the period on the Dashboard and navigates to the 1:1 page, the selection resets to the default ("this-month"). This forces re-selecting the period on every page switch, which is frustrating and breaks the cross-page metric review workflow.

## What Changes

- Lift the `PeriodProvider` to the root layout level so the selected period persists across page navigation
- Move the `PeriodSelector` component into the global application header (next to the `SidebarTrigger`)
- Remove local `PeriodProvider` and `PeriodSelector` from the Dashboard and 1:1 Preparation pages
- Evaluate whether the Review Quality page (local month selector) and Sync page (local quarter selector) should consume the global context

## Capabilities

### New Capabilities
- `global-period-context`: Lift PeriodProvider to the root layout and display PeriodSelector in the global header, shared across all pages

### Modified Capabilities

## Impact

- `src/app/layout.tsx` — add PeriodProvider and PeriodSelector to the header
- `src/app/dashboard-context.tsx` — remove or refactor the local PeriodProvider
- `src/app/dashboard-content.tsx` — remove local PeriodProvider and PeriodSelector
- `src/app/one-on-one/one-on-one-content.tsx` — remove local PeriodProvider and PeriodSelector
- `src/app/period-selector.tsx` — potential relocation or adaptation of the component
- Existing tests to adapt for the new global context
