## Context

The Review Quality page (`src/app/review-quality/review-quality-content.tsx`) currently renders its layout in this order: Title → Summary → Charts → Filters → Comments → Classification History. The filter controls are buried below two large visual sections, requiring users to scroll before they can set their filtering scope.

The page uses two separate date selection mechanisms:
1. A `FilterBar` with manual `dateStart`/`dateEnd` HTML date inputs
2. A `MonthNavigator` component in the comments table header for month-by-month navigation

Meanwhile, the main dashboard uses a `PeriodSelector` component backed by `PeriodContext` (from `src/app/dashboard-context.tsx`) that provides preset-based date ranges (this-week, last-month, this-quarter, etc.) via `src/lib/date-periods.ts`.

## Goals / Non-Goals

**Goals:**
- Move filters to the top of the page so users set scope before viewing data
- Replace manual date inputs and MonthNavigator with PeriodSelector presets for consistency with the dashboard
- Keep a single horizontal filter strip (period + category + reviewer + confidence)

**Non-Goals:**
- Refactoring the dashboard's `PeriodContext`/`PeriodProvider` to be shared app-wide (Review Quality will manage its own period state locally)
- Changing API contracts — endpoints already accept `dateStart`/`dateEnd` query params
- Adding new filter types (e.g., PR filter, label filter)
- Modifying the charts or summary sections themselves

## Decisions

### 1. Local period state instead of shared PeriodContext

**Decision:** Review Quality will manage its own `PeriodPreset` state locally in `review-quality-content.tsx` and compute `DateRange` via `getDateRangeForPreset()`.

**Rationale:** The dashboard's `PeriodContext` is tightly coupled to `dashboard-context.tsx` and the dashboard layout. Reusing it would require wrapping Review Quality in a `PeriodProvider`, which adds unnecessary coupling. The period utilities in `src/lib/date-periods.ts` are already standalone and provide everything needed.

**Alternative considered:** Extract a shared `PeriodProvider` at app layout level — rejected because it would force synchronization between unrelated pages.

### 2. Inline PeriodSelector in FilterBar

**Decision:** Create a standalone period select dropdown directly inside the `FilterBar` component instead of reusing the dashboard's `PeriodSelector` component.

**Rationale:** The existing `PeriodSelector` is coupled to `usePeriod()` from dashboard context. Rather than making it configurable with props vs. context, it's simpler to add a `<Select>` with `PERIOD_LABELS` directly in `FilterBar`. This avoids touching the dashboard code entirely.

### 3. Default period preset: "this-month"

**Decision:** The default period preset will be `"this-month"`, matching the dashboard's default.

**Rationale:** Most users review recent data. "This month" provides a reasonable default scope that shows enough data without being overwhelming.

### 4. Remove MonthNavigator entirely

**Decision:** The `MonthNavigator` component will be removed from the comments card header and deleted.

**Rationale:** The PeriodSelector subsumes its functionality with more flexibility (week, sprint, month, quarter presets). Keeping both would be confusing.

## Risks / Trade-offs

- **[Loss of month-by-month navigation UX]** → The MonthNavigator provided easy prev/next month buttons. With PeriodSelector, users must open a dropdown to switch periods. Mitigation: the preset options are quick to select and provide more flexibility (weeks, sprints, quarters).
- **[No custom date range]** → Removing the manual date inputs means users can no longer pick arbitrary date ranges. Mitigation: the 8 preset options cover the vast majority of use cases. Custom ranges can be added later if needed.
