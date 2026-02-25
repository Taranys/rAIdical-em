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

_To be filled before implementation._
