# US-023: Application Shell and Navigation

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want a clean sidebar navigation so that I can easily move between dashboard, team, and settings pages.

## Dependencies

None — this is the foundational story for Phase 1.

## Acceptance Criteria

- [x] A persistent sidebar wraps all pages with navigation links to: Dashboard, Team, Settings
- [x] The current page is visually highlighted in the sidebar
- [x] The layout is responsive (works on laptop screens; mobile is not required)
- [x] The app title "em-control-tower" is visible in the sidebar

## Plan and implementation details

**Goal:** Add a persistent sidebar navigation using shadcn/ui Sidebar component with links to Dashboard (`/`), Team (`/team`), and Settings (`/settings`). Current page highlighted, app title visible in sidebar, responsive for laptop screens.

**Steps:**
1. Install shadcn/ui Sidebar component (`npx shadcn add sidebar`)
2. Write unit tests for `AppSidebar` (TDD RED)
3. Implement `AppSidebar` client component with `usePathname()` active highlighting (TDD GREEN)
4. Modify `layout.tsx` — wrap in `SidebarProvider`, add sidebar + trigger
5. Update `page.tsx` — remove redundant outer wrapper
6. Create `/team` and `/settings` placeholder pages
7. Write E2E navigation test
8. Run all tests + lint + build
9. Finalize docs

**Key files:**

| File | Action |
|------|--------|
| `src/components/app-sidebar.tsx` | Created — sidebar navigation component |
| `src/components/app-sidebar.test.tsx` | Created — unit tests |
| `src/app/layout.tsx` | Modified — add SidebarProvider + AppSidebar |
| `src/app/page.tsx` | Modified — remove outer min-h-screen div |
| `src/app/team/page.tsx` | Created — placeholder page |
| `src/app/settings/page.tsx` | Created — placeholder page |
| `e2e/navigation.spec.ts` | Created — E2E navigation test |
