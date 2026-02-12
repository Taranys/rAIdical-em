# Plan 002: US-023 — Application Shell and Navigation

## Goal

Add a persistent sidebar navigation using shadcn/ui Sidebar component with links to Dashboard (`/`), Team (`/team`), and Settings (`/settings`). Current page highlighted, app title visible in sidebar, responsive for laptop screens.

## Steps

1. Install shadcn/ui Sidebar component (`npx shadcn add sidebar`)
2. Write unit tests for `AppSidebar` (TDD RED)
3. Implement `AppSidebar` client component with `usePathname()` active highlighting (TDD GREEN)
4. Modify `layout.tsx` — wrap in `SidebarProvider`, add sidebar + trigger
5. Update `page.tsx` — remove redundant outer wrapper
6. Create `/team` and `/settings` placeholder pages
7. Write E2E navigation test
8. Run all tests + lint + build
9. Finalize docs

## Key Files

| File | Action |
|------|--------|
| `src/components/app-sidebar.tsx` | Create — sidebar navigation component |
| `src/components/app-sidebar.test.tsx` | Create — unit tests |
| `src/app/layout.tsx` | Modify — add SidebarProvider + AppSidebar |
| `src/app/page.tsx` | Modify — remove outer min-h-screen div |
| `src/app/team/page.tsx` | Create — placeholder page |
| `src/app/settings/page.tsx` | Create — placeholder page |
| `e2e/navigation.spec.ts` | Create — E2E navigation test |
