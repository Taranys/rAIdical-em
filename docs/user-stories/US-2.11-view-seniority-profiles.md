# US-2.11: View Seniority Profiles

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Todo

## Story

As an engineering manager, I want to view the computed seniority profiles of my team so that I can quickly assess each person's review maturity per language.

## Acceptance Criteria

- [ ] A "Team Profiles" page (or section within Review Quality) is accessible from the sidebar
- [ ] Each team member is shown as a card with: avatar, display name, overall seniority level badge
- [ ] Expanding a member card reveals per-language breakdown: language name, seniority level, review depth score, comment volume
- [ ] A radar/spider chart visualizes the balance of category types for each team member (e.g., strong on architecture, weak on testing)
- [ ] Profiles can be compared side-by-side (select 2–3 members for comparison)
- [ ] A "last computed" timestamp is displayed for each profile
- [ ] If a profile has not been computed yet, a prompt suggests running classification first

## Dependencies

- [US-2.10: Seniority Profile Computation](US-2.10-seniority-profile-computation.md) — profiles must be computed
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation
