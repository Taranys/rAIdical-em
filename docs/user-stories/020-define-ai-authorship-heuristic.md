# US-020: Define AI Authorship Heuristic

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to configure the rules that determine whether a PR is AI-generated so that the AI vs. human ratio reflects my team's actual workflow.

## Acceptance Criteria

- [x] The settings page has a section for AI detection rules
- [x] Supported heuristics (configurable, multiple can be active):
  - **Co-author pattern**: PR commits contain a `Co-Authored-By` trailer matching a configurable pattern (e.g., `*[bot]*`, `*Claude*`, `*Copilot*`)
  - **Author is bot**: PR author username matches a configurable list (e.g., `dependabot`, `renovate`)
  - **Branch name pattern**: Branch name matches a configurable pattern (e.g., `ai/*`, `copilot/*`)
  - **Label-based**: PR has a specific GitHub label (e.g., `ai-generated`)
- [x] Default heuristics are pre-filled but editable
- [x] Each PR is tagged as `ai`, `human`, or `mixed` based on the active rules

## Dependencies

- [US-005: Configure GitHub PAT](005-configure-github-pat.md) — settings page must exist
- [US-022: Database Schema](022-database-schema-phase1.md) — settings table must exist for heuristic config storage
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation to settings page
