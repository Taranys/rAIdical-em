## Why

The PeriodSelector component currently displays the date range label (e.g., "Mar 1 – Mar 31, 2026") below the dropdown selector in a vertical layout. This creates visual clutter and doesn't look clean, especially in the app header where horizontal space is available.

## What Changes

- Reposition the date range label from below the selector to the right side of the selector
- Change the PeriodSelector layout from vertical (`flex-col`) to horizontal (`flex-row`)
- Adjust alignment and spacing for a cleaner visual appearance

## Capabilities

### New Capabilities

- `period-selector-horizontal-layout`: Horizontal layout for the PeriodSelector with the date range label displayed to the right of the dropdown

### Modified Capabilities

_(none)_

## Impact

- `src/app/period-selector.tsx` — Layout change from vertical to horizontal
- No API changes, no dependency changes, no breaking changes
