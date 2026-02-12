# US-2.14: 1:1 Preparation View

**Phase:** 2 — Review Quality Analysis
**Epic:** D — Highlight Reel & 1:1 Preparation
**Status:** Todo

## Story

As an engineering manager, I want a dedicated 1:1 preparation view per team member so that I can walk into every 1:1 with specific, data-backed talking points.

## Acceptance Criteria

- [ ] A "1:1 Prep" page is accessible from the sidebar navigation
- [ ] The page shows a team member selector (dropdown or card grid)
- [ ] For the selected team member, the view displays:
  - **Summary card**: overall maturity level, review depth score, total reviews in period, top competency dimensions (technical + soft skills), top categories
  - **Best comments section**: the top 3–5 highlights with comment body, PR link, and LLM reasoning (from US-2.12)
  - **Growth opportunities section**: the top 3–5 opportunities with original comment, context, and improvement suggestion (from US-2.13)
  - **Review activity sparkline**: mini chart of review frequency over the period
- [ ] A period selector (reusing US-019) filters the data
- [ ] The view is printable / exportable (clean layout when printed via browser print)
- [ ] If no highlights exist for the selected member, a prompt suggests running classification

## Dependencies

- [US-2.12: Detect Best Comments](US-2.12-detect-best-comments.md) — best comment highlights
- [US-2.13: Detect Growth Opportunities](US-2.13-detect-growth-opportunities.md) — growth opportunity highlights
- [US-2.11: View Seniority Profiles](US-2.11-view-seniority-profiles.md) — seniority data for summary card
- [US-019: Dashboard Period Selector](019-dashboard-period-selector.md) — period filter
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation
