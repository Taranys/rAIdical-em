## 1. FilterBar: Replace date inputs with period selector

- [x] 1.1 Add `periodPreset` prop and `onPeriodChange` callback to `FilterBar` props interface in `src/app/review-quality/filter-bar.tsx`
- [x] 1.2 Replace the dateStart/dateEnd inputs with a period preset `<Select>` dropdown using `PERIOD_LABELS` from `src/lib/date-periods.ts`
- [x] 1.3 Remove the `dateStart` and `dateEnd` fields from the `Filters` interface in `filter-bar.tsx`

## 2. State management: Period preset in review-quality-content

- [x] 2.1 Add `periodPreset` state (default `"this-month"`) in `review-quality-content.tsx` and compute `DateRange` via `getDateRangeForPreset()`
- [x] 2.2 Replace `currentMonth` / `handleMonthChange` / `getFiltersForMonth` logic with period-based date range derived from the preset
- [x] 2.3 Pass `periodPreset` and `onPeriodChange` handler to `FilterBar`, wire period changes to reload summary, charts, and comments
- [x] 2.4 Update `filters` state to no longer include `dateStart`/`dateEnd` — derive them from the period preset when calling APIs

## 3. Layout reorder: Move filters to the top

- [x] 3.1 In `review-quality-content.tsx`, move the Filters `<Card>` block above the Summary and Charts cards (immediately after the `<h1>` title)

## 4. Remove MonthNavigator

- [x] 4.1 Remove the `<MonthNavigator>` component from the comments card header in `review-quality-content.tsx`
- [x] 4.2 Simplify the comments card header to show only title and count (remove the flex justify-between wrapper if no longer needed)
- [x] 4.3 Delete `src/app/review-quality/month-navigator.tsx`

## 5. Tests

- [x] 5.1 Update existing unit tests for `FilterBar` to reflect new props (periodPreset instead of dateStart/dateEnd)
- [x] 5.2 Update existing unit tests for `review-quality-content` to verify filters render above summary/charts
- [x] 5.3 Verify the period selector defaults to "This month" and triggers data reload on change
- [x] 5.4 Run full test suite (`npm test`) and fix any regressions
