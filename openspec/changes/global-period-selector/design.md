## Context

The `PeriodProvider` (React Context + useState) is currently instantiated independently in `DashboardContent` and `OneOnOneContent`. Each page has its own instance with a default state of "this-month". When the user changes the period on one page and navigates away, the selection is lost.

The root layout (`src/app/layout.tsx`) already provides a global shell with `SidebarProvider`, `AppSidebar`, and a header containing the `SidebarTrigger`. This is the natural anchor point for a global context.

## Goals / Non-Goals

**Goals:**
- The selected period persists across page navigation
- The PeriodSelector is accessible from all pages in the global header
- Existing pages (Dashboard, 1:1) continue to work with the global context without regressions

**Non-Goals:**
- Persisting the selected period beyond a refresh (localStorage, URL params) — not in this iteration
- Unifying the Sync page quarter selector or the Review Quality month selector with the PeriodSelector — these pages have specific needs
- Adding new period presets

## Decisions

### 1. Lift PeriodProvider to the root layout

**Choice:** Wrap the root layout's `children` with the `PeriodProvider`, placing it inside the existing `SidebarProvider`.

**Rationale:** This is the simplest approach. The provider is already a standard React Context component with no side effects. Lifting it up the tree doesn't change its API — `usePeriod()` will work identically from any page.

**Alternative considered:** Create an intermediate layout (`(dashboard)/layout.tsx`) to only wrap pages that use the period. Rejected because it adds complexity without benefit: the provider is lightweight and pages that don't use `usePeriod()` are not affected.

### 2. Move PeriodSelector to the global header

**Choice:** Add the `PeriodSelector` to the root layout's `<header>`, next to the `SidebarTrigger`, right-aligned with `ml-auto`.

**Rationale:** The header is already present on all pages. Placing the selector here makes it accessible everywhere without duplication. The existing layout (flex, h-12) can accommodate the component without major structural changes.

**Alternative considered:** Place the selector in the sidebar. Rejected because the sidebar can be collapsed and the selector must always be visible.

### 3. Extract the header into a dedicated client component

**Choice:** Create an `AppHeader` component ("use client") containing the `SidebarTrigger` and the `PeriodSelector`. The root layout (Server Component) will import this component.

**Rationale:** The root layout is a Server Component. The `PeriodSelector` needs `usePeriod()` (client-side). Extracting the header into a client component keeps the layout as a Server Component while using the context.

### 4. Remove local PeriodProvider and PeriodSelector

**Choice:** Remove the `PeriodProvider` wrapper from `DashboardContent` and `OneOnOneContent`, and remove the `PeriodSelector` from their page headers. Components will continue calling `usePeriod()` normally since the provider is now above them in the tree.

**Rationale:** Avoids double-providers (which would create isolated contexts) and selector duplication.

## Risks / Trade-offs

- **[Header is a Server Component]** → Mitigation: extract a client `AppHeader` component. Minimal impact since the header doesn't do server-side fetching.
- **[Pages without period needs see the selector]** → Acceptable trade-off. Team, Settings, and Team Profiles pages don't use it but the selector remains unobtrusive in the header. If needed later, it can be conditionally hidden by route.
- **[Print layout for the 1:1 page]** → The 1:1 page uses `print:hidden` on the local PeriodSelector. With the selector in the global header, the entire header is hidden during printing (`print:hidden` on the header). Verify that `period.label` in print mode still works.
