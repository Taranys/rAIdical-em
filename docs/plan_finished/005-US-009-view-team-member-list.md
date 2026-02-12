# Plan 005: US-009 — View Team Member List

## Summary

Enhance the existing `/team` page to display team members in a proper table with avatar, display name, GitHub username, and date added. Most infrastructure (DB, DAL, API, sorting, empty state) already exists from US-007.

## Changes

### 1. Install shadcn/ui Table component
- `npx shadcn add table` → creates `src/components/ui/table.tsx`
- Consistent with existing shadcn/ui pattern, no new npm dependencies

### 2. Unit tests (TDD) — `src/app/team/page.test.tsx`
Added 2 new tests:
- "renders table column headers when members exist" — asserts columnheader roles for Member, GitHub Username, Date Added
- "displays date added for team members" — asserts formatted date (e.g. "Jan 15, 2024")

### 3. Team page UI — `src/app/team/page.tsx`
- Import Table components from shadcn/ui
- Add `formatDate()` helper using `toLocaleDateString("en-US", ...)`
- Replace div-based member list with `<Table>`:
  - Column 1: "Member" — avatar + display name
  - Column 2: "GitHub Username" — @username
  - Column 3: "Date Added" — formatted createdAt
- Empty state and loading state unchanged

## Files Modified

| File | Action |
|------|--------|
| `src/components/ui/table.tsx` | Created (shadcn) |
| `src/app/team/page.test.tsx` | Added 2 tests |
| `src/app/team/page.tsx` | Replaced list with table, added date formatting |
| `docs/user-stories/009-view-team-member-list.md` | Marked Done |

## Not Changed

- `src/db/team-members.ts` — already sorts by displayName asc, returns createdAt
- `src/app/api/team/route.ts` — already returns all fields
- `e2e/team.spec.ts` — no new golden path
