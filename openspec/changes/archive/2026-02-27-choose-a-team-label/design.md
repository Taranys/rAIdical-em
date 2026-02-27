## Context

The GitHub import sheet (`src/app/team/import-github-sheet.tsx`) contains a team filter dropdown. Its default `<option>` currently reads "All members". This label is misleading — it suggests a filtered view rather than a prompt to select a team. The change replaces it with "Choose a team" to better guide the user.

## Goals / Non-Goals

**Goals:**
- Replace the default option label from "All members" to "Choose a team"
- Update tests to match the new label

**Non-Goals:**
- Changing the behavior of the team selector (filtering logic stays the same)
- Changing the `value=""` of the default option
- Internationalizing the label

## Decisions

**Direct string replacement**: Replace the label text in the JSX and update test assertions. No abstraction or constant extraction needed — it's a single occurrence.

## Risks / Trade-offs

No meaningful risks. This is a cosmetic text change with no behavioral impact.
