## Why

The Review Quality page currently buries its filters below the charts and summary sections, forcing users to scroll down before they can narrow their data. Additionally, the page uses a custom `MonthNavigator` for date selection instead of the `PeriodSelector` preset-based approach already used on the main dashboard. This inconsistency makes the UX feel fragmented and less efficient — users must manually pick month boundaries instead of quickly selecting presets like "This month" or "Last quarter".

## What Changes

- **Move the Filters section to the top of the page**, immediately below the page title. All data-driven sections (summary, charts, comments table) render below the filters, so users set their scope first.
- **Replace the `MonthNavigator` with the `PeriodSelector`** (preset-based dropdown) as the primary date selection mechanism. The existing `dateStart`/`dateEnd` manual inputs in the `FilterBar` are removed — the period preset drives the date range for all queries.
- **Integrate the `PeriodSelector` into the filter bar row** so that period, category, reviewer, and confidence threshold are all on a single horizontal controls strip.
- **Remove the `MonthNavigator` component** from the comments table card header since period selection is now handled at the top level.

## Capabilities

### New Capabilities
- `review-quality-period-filter`: Integrate the PeriodSelector preset dropdown into the Review Quality filter bar, replacing the MonthNavigator and manual date inputs with a unified period-based filtering approach.

### Modified Capabilities


## Impact

- `src/app/review-quality/review-quality-content.tsx` — Layout reordering (filters card moves above summary/charts), period state management changes
- `src/app/review-quality/filter-bar.tsx` — Remove dateStart/dateEnd inputs, add PeriodSelector integration
- `src/app/review-quality/month-navigator.tsx` — To be removed (no longer used)
- `src/lib/date-periods.ts` — No changes needed (already provides all required utilities)
- `src/app/period-selector.tsx` — May need to be decoupled from `dashboard-context` to be reusable, or Review Quality will use the same preset utilities directly
- API routes (`/api/review-quality/comments`, `/api/review-quality/charts`, `/api/review-quality/summary`) — No API changes needed, they already accept dateStart/dateEnd params
