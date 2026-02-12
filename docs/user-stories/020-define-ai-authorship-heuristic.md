# US-020: Define AI Authorship Heuristic

**Phase:** 1 — GitHub Integration
**Status:** Todo

## Story

As an engineering manager, I want to configure the rules that determine whether a PR is AI-generated so that the AI vs. human ratio reflects my team's actual workflow.

## Acceptance Criteria

- [ ] The settings page has a section for AI detection rules
- [ ] Supported heuristics (configurable, multiple can be active):
  - **Co-author pattern**: PR commits contain a `Co-Authored-By` trailer matching a configurable pattern (e.g., `*[bot]*`, `*Claude*`, `*Copilot*`)
  - **Author is bot**: PR author username matches a configurable list (e.g., `dependabot`, `renovate`)
  - **Branch name pattern**: Branch name matches a configurable pattern (e.g., `ai/*`, `copilot/*`)
  - **Label-based**: PR has a specific GitHub label (e.g., `ai-generated`)
- [ ] Default heuristics are pre-filled but editable
- [ ] Each PR is tagged as `ai`, `human`, or `mixed` based on the active rules
