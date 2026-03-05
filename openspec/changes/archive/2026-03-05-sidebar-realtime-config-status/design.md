## Context

The sidebar displays configuration status indicators (green check / amber alert) for Settings, Team, and Sync items. The current `useSidebarStatus` hook fetches status once on mount and only polls during active sync runs (every 2s). There is no mechanism for other pages to trigger a sidebar refresh after configuration changes.

The sidebar and configuration pages (Settings, Team) are sibling components in the Next.js App Router layout tree. They share no state — the sidebar uses its own hook instance, and each page manages local state independently. All communication currently happens through the database: pages write, sidebar reads (on next poll or mount).

Relevant files:
- `src/hooks/use-sidebar-status.ts` — hook returning `SidebarStatus`, handles polling
- `src/components/app-sidebar.tsx` — renders status icons, calls `useSidebarStatus()`
- `src/app/settings/` — PAT, repos, LLM configuration forms
- `src/app/team/page.tsx` — team member management

## Goals / Non-Goals

**Goals:**
- Sidebar status icons update immediately (within ~200ms) after any configuration mutation
- Zero additional API endpoints — reuse existing `GET /api/sidebar-status`
- Minimal changes to existing component APIs
- Preserve existing sync polling behavior unchanged

**Non-Goals:**
- Real-time updates from external sources (e.g., another user changing config) — this is a single-user app
- WebSocket or Server-Sent Events — overkill for this use case
- Optimistic updates in the sidebar — always fetch fresh data from the API for accuracy

## Decisions

### Decision 1: React Context for shared refresh function

**Choice:** Create a `SidebarStatusContext` that provides `{ status: SidebarStatus, refresh: () => Promise<void> }` to the entire app. The `useSidebarStatus` hook moves its state into this context. Any page can call `refresh()` to trigger an immediate re-fetch.

**Rationale:** React Context is the standard pattern for sharing state across sibling components in the React tree. The sidebar and settings page are siblings under the root layout, making Context the natural choice. It requires no external dependencies and the hook already manages the state — we just lift it into a provider.

**Alternative considered:** Custom event emitter (e.g., `window.dispatchEvent`). Rejected — works but bypasses React's rendering model, making it harder to test and reason about. Context integrates natively with React rendering.

**Alternative considered:** SWR or React Query for `/api/sidebar-status`. Rejected — adds a dependency for a single endpoint. The existing hook is simple and sufficient; we just need to share its refresh function.

### Decision 2: Provider placement in the root layout

**Choice:** Wrap the `SidebarStatusProvider` in `src/app/layout.tsx` (or the existing layout that contains both the sidebar and page content), so both the sidebar and any page can access the context.

**Rationale:** The root layout is the lowest common ancestor of the sidebar and all pages. Placing the provider here ensures universal access without extra wiring.

### Decision 3: Consumer hook `useSidebarStatusContext`

**Choice:** Export a `useSidebarStatusContext()` hook that returns `{ status, refresh }` from the context. The sidebar uses `status` for display, and pages call `refresh()` after mutations.

**Rationale:** A single hook gives a clean API. Pages only need to destructure `{ refresh }` — they don't care about the status itself. The sidebar destructures `{ status }` — it doesn't call refresh directly.

### Decision 4: Call refresh() after each mutation success callback

**Choice:** In each settings form and the team page, call `refresh()` inside the success path of mutation handlers (e.g., after `handleSave`, `handleDelete`, `handleRemove`, `handleAddMember`).

**Rationale:** This is explicit and predictable. Each mutation knows when it succeeds and triggers one refresh. No debouncing needed — config changes are infrequent user actions (not rapid-fire).

## Risks / Trade-offs

- **[Extra API call per mutation]** → One additional `GET /api/sidebar-status` per config change. This endpoint queries SQLite synchronously and returns in <10ms. Negligible impact.
- **[Context re-renders]** → When `refresh()` updates the status, all context consumers re-render. The sidebar is the main consumer and it's a small component. Pages that only use `refresh` don't need to re-render on status changes — they can destructure only `refresh` and memo if needed. In practice, the component tree is small enough that this is a non-issue.
- **[Race condition: mutation not yet committed]** → The `refresh()` call happens after the mutation API returns success, so the database already reflects the change. The sidebar-status endpoint reads from the same SQLite database synchronously. No race condition possible.
