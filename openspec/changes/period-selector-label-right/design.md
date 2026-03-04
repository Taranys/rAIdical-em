## Context

The `PeriodSelector` component (`src/app/period-selector.tsx`) currently uses a vertical flex layout (`flex-col`) with the date range label displayed below the dropdown. The component is placed in the app header via `app-header.tsx` with `ml-auto` alignment. The vertical stacking makes the header taller than necessary and doesn't look visually clean.

## Goals / Non-Goals

**Goals:**
- Display the date range label to the right of the dropdown selector in a horizontal layout
- Maintain the existing functionality (period selection, label display)
- Keep the visual hierarchy (selector prominent, label secondary)

**Non-Goals:**
- Changing the dropdown width or styling
- Modifying the date formatting logic
- Adding new period presets

## Decisions

**Horizontal layout with `flex-row`**: Change the container from `flex flex-col items-end gap-1` to `flex flex-row items-center gap-3`. This places the label inline with the selector, using center vertical alignment for proper visual balance. A `gap-3` (12px) provides comfortable spacing between the dropdown and the label.

**Alternatives considered:**
- Putting the label inside the `SelectTrigger` — rejected because it would make the dropdown too wide and mix two pieces of information (preset name + date range)
- Using a tooltip on hover — rejected because it hides useful information behind an interaction

## Risks / Trade-offs

- [Narrow viewports] The horizontal layout takes more horizontal space → The app header already has `ml-auto` and there is sufficient space. On very narrow screens, the label text is short enough (~25 chars) to fit comfortably.
