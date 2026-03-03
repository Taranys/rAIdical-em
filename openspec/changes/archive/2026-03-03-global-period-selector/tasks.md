## 1. Extract global header

- [x] 1.1 Create the `AppHeader` component ("use client") in `src/components/app-header.tsx` containing the `SidebarTrigger` and the `PeriodSelector`, with `print:hidden` on the header
- [x] 1.2 Update `src/app/layout.tsx` to use `AppHeader` instead of the current inline header

## 2. Lift PeriodProvider to root layout

- [x] 2.1 Create a client wrapper component `AppProviders` in `src/components/app-providers.tsx` that wraps `PeriodProvider` (and potentially other global providers) around children
- [x] 2.2 Update `src/app/layout.tsx` to wrap content with `AppProviders`

## 3. Remove local providers and selectors

- [x] 3.1 Remove `PeriodProvider` and `PeriodSelector` from `src/app/dashboard-content.tsx` — metric cards will consume the global context
- [x] 3.2 Remove `PeriodProvider` and `PeriodSelector` from `src/app/one-on-one/one-on-one-content.tsx` — the `OneOnOneInner` component will consume the global context

## 4. Tests and validation

- [x] 4.1 Update existing Dashboard and 1:1 page tests to reflect the global provider (wrap tests with `PeriodProvider` at the correct level)
- [x] 4.2 Verify that build passes (`npm run build`) and lint is clean (`npm run lint`)
- [x] 4.3 Verify print behavior for the 1:1 page (`period.label` remains visible in printed output)
