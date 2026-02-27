## Why

The team selector dropdown in the GitHub import sheet currently shows "All members" as its default/placeholder label. This is misleading because it implies all members are already being shown, when in reality it's the unfiltered state. "Choose a team" better communicates that the user can select a specific team to filter members.

## What Changes

- Replace the default option label in the team selector `<select>` from "All members" to "Choose a team" in the GitHub import sheet
- Update corresponding tests to reflect the new label

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

_(none — this is a simple label text change with no spec-level behavior change)_

## Impact

- `src/app/team/import-github-sheet.tsx`: Change default option text
- `src/app/team/import-github-sheet.test.tsx`: Update test assertions referencing the old label
