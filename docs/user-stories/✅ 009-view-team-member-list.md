# US-009: View Team Member List

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to see all my tracked team members at a glance so that I know who is being monitored.

## Dependencies

- ✅ [US-007: Add a Team Member](✅%20007-add-team-member.md) — the add member form and team page must exist

## Acceptance Criteria

- [x] The `/team` page shows a table/grid with: avatar, display name, GitHub username, date added
- [x] The list is sorted alphabetically by display name
- [x] If no members are added, a helpful empty state is shown with a prompt to add members

## Plan and implementation details

**Goal:** Enhance the existing `/team` page to display team members in a proper table with avatar, display name, GitHub username, and date added. Most infrastructure (DB, DAL, API, sorting, empty state) already exists from US-007.

**Changes:**
1. Install shadcn/ui Table component (`npx shadcn add table`)
2. Unit tests (TDD) — added 2 new tests in `src/app/team/page.test.tsx`
3. Team page UI — replaced div-based member list with `<Table>` (Member, GitHub Username, Date Added columns)

**Key files:**

| File | Action |
|------|--------|
| `src/components/ui/table.tsx` | Created (shadcn) |
| `src/app/team/page.test.tsx` | Added 2 tests |
| `src/app/team/page.tsx` | Replaced list with table, added date formatting |
