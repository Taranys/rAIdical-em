# US-2.11: View Seniority Profiles

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Done

## Story

As an engineering manager, I want to view the computed competency profiles of my team so that I can quickly assess each person's review maturity across technical domains and soft skills.

## Dependencies

- ✅ [US-2.10: Seniority Profile Computation](✅%20US-2.10-seniority-profile-computation.md) — profiles must be computed
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation

## Acceptance Criteria

- [x] A "Team Profiles" page (or section within Review Quality) is accessible from the sidebar
- [x] Each team member is shown as a card with: avatar, display name, overall maturity level badge
- [x] Expanding a member card reveals two sections:
  - **Technical domains**: per-dimension breakdown (languages, security, infra, performance, testing, architecture) with maturity level, depth score, comment volume
  - **Soft skills**: per-dimension breakdown (pedagogy, cross-team awareness, boldness, thoroughness) with maturity level and supporting evidence
- [x] A radar/spider chart visualizes the balance across all dimensions for each team member (e.g., strong on architecture and pedagogy, room to grow on security and boldness)
- [x] A toggle allows switching between "Technical only", "Soft skills only", and "All dimensions" views
- [x] Profiles can be compared side-by-side (select 2–3 members for comparison)
- [x] A "last computed" timestamp is displayed for each profile
- [x] If a profile has not been computed yet, a prompt suggests running classification first

## Plan and implementation details

### Implementation plan

Server Component page at `/team-profiles` backed by an API route that aggregates team members with their seniority profiles. Each member is rendered as a card with avatar and a Recharts RadarChart showing maturity levels across all dimensions. A "Team Profiles" entry was added to the sidebar navigation.

### Key files

- `src/app/team-profiles/page.tsx` — Server Component page entry (force-dynamic)
- `src/app/team-profiles/team-profiles-content.tsx` — Client component: fetches data, renders member cards in a 2-column grid
- `src/app/team-profiles/seniority-radar-chart.tsx` — Recharts RadarChart component mapping maturity levels (junior=1, experienced=2, senior=3) to a spider chart
- `src/app/team-profiles/seniority-radar-chart.test.tsx` — Unit tests for the radar chart
- `src/app/api/team-profiles/route.ts` — API route joining `getAllTeamMembers()` with `getProfilesByTeamMember()` per member
- `src/components/app-sidebar.tsx` — Added "Team Profiles" nav item with `Radar` icon from lucide-react

### Implementation notes

- The radar chart uses Recharts `RadarChart` + `PolarGrid` + `PolarAngleAxis` + `PolarRadiusAxis` with a fixed domain [0, 3] for the three maturity levels.
- Each member's color (from team settings) is used for the radar fill and stroke, giving visual consistency across the app.
- Dimension names are formatted from snake_case to Title Case for display (e.g., `cross_team_awareness` → "Cross Team Awareness").
- A custom tooltip shows dimension name and maturity label on hover.
- Members with no computed profiles display a fallback message prompting to run classification first.
- The grid layout is responsive: single column on mobile, 2-column on md+ screens.
