## Why

The sidebar status indicators (green check / amber alert) only refresh on initial page load or while a sync is running (2s polling). When a user configures their GitHub PAT, adds a repository, sets up the LLM provider, or adds a team member, the sidebar icons stay stale until the next page navigation. This breaks the feedback loop — users can't tell if their configuration action actually "worked" from the sidebar perspective, and the onboarding experience feels disconnected.

## What Changes

- Expose a `refresh()` function from the `useSidebarStatus` hook so that any component in the tree can trigger an immediate sidebar status re-fetch
- Provide this `refresh` function via a React Context so it's accessible from any page (Settings, Team, etc.) without prop drilling
- Call `refresh()` after every configuration mutation: saving/deleting a GitHub PAT, adding/removing a repository, saving/deleting the LLM provider, and adding/removing team members
- The existing polling behavior for sync status remains unchanged

## Capabilities

### New Capabilities

_None — this change introduces no new user-facing capability. It improves the responsiveness of an existing one._

### Modified Capabilities

- `sidebar-config-status`: Status indicators SHALL update immediately after any configuration change, not just on page navigation or sync polling

## Impact

- **Hook:** `src/hooks/use-sidebar-status.ts` — expose a `refresh` function alongside the status
- **Context:** New `SidebarStatusProvider` context wrapping the app layout, providing `{ status, refresh }` to the component tree
- **Sidebar:** `src/components/app-sidebar.tsx` — consume context instead of calling hook directly
- **Settings page:** `src/app/settings/` — call `refresh()` after PAT, repo, and LLM mutations
- **Team page:** `src/app/team/page.tsx` — call `refresh()` after adding/removing team members
- **No API changes** — uses the existing `GET /api/sidebar-status` endpoint
- **No database changes**
