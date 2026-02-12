# US-021: View AI vs. Human Authorship Ratio

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to see the ratio of AI-generated vs. human-written PRs per team member so that I can understand how AI adoption evolves across the team.

## Acceptance Criteria

- [ ] The dashboard shows a stacked bar chart or percentage breakdown per team member: AI / Human / Mixed
- [ ] The global date range filter applies
- [ ] A team-level aggregate is also shown (total AI vs. human across all members)

## Dependencies

- [US-010: Fetch Pull Requests](010-fetch-pull-requests.md) — PR data must be synced before it can be classified
- [US-019: Dashboard Period Selector](019-dashboard-period-selector.md) — period selector must exist to filter the data
- [US-020: Define AI Authorship Heuristic](020-define-ai-authorship-heuristic.md) — heuristic rules must be configured to classify PRs
