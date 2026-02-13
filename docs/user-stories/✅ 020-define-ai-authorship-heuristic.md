# US-020: Define AI Authorship Heuristic

**Phase:** 1 — GitHub Integration
**Status:** Done

## Story

As an engineering manager, I want to configure the rules that determine whether a PR is AI-generated so that the AI vs. human ratio reflects my team's actual workflow.

## Dependencies

- ✅ [US-005: Configure GitHub PAT](✅%20005-configure-github-pat.md) — settings page must exist
- ✅ [US-022: Database Schema](✅%20022-database-schema-phase1.md) — settings table must exist for heuristic config storage
- ✅ [US-023: Application Shell](✅%20023-application-shell-navigation.md) — sidebar navigation to settings page

## Acceptance Criteria

- [x] The settings page has a section for AI detection rules
- [x] Supported heuristics (configurable, multiple can be active):
  - **Co-author pattern**: PR commits contain a `Co-Authored-By` trailer matching a configurable pattern (e.g., `*[bot]*`, `*Claude*`, `*Copilot*`)
  - **Author is bot**: PR author username matches a configurable list (e.g., `dependabot`, `renovate`)
  - **Branch name pattern**: Branch name matches a configurable pattern (e.g., `ai/*`, `copilot/*`)
  - **Label-based**: PR has a specific GitHub label (e.g., `ai-generated`)
- [x] Default heuristics are pre-filled but editable
- [x] Each PR is tagged as `ai`, `human`, or `mixed` based on the active rules

## Plan and implementation details

**Goal:** Configurable AI detection rules on the settings page plus a classification engine that tags PRs as `ai`, `human`, or `mixed`.

**Changes:**
- **Schema migration:** Changed `pullRequests.aiGenerated` from `integer (0/1)` to `text ("ai"/"human"/"mixed")`, default `"human"`. Drizzle migration with data migration.
- **AI detection library** (`src/lib/ai-detection.ts`): Types, default heuristics, `matchesGlob()`, `hasCoAuthorMatch()`, `classifyPullRequest()` (collects signals → `"ai"`, `"mixed"`, or `"human"`).
- **API route** (`src/app/api/settings/ai-heuristics/route.ts`): GET/PUT/DELETE for heuristic config.
- **Settings UI** (`src/app/settings/ai-heuristics-form.tsx`): Card with 4 heuristic sections, save/reset buttons.
- **Tests:** 32 unit tests (classification logic), 8 unit tests (API), 10 unit tests (UI), 1 integration test, 2 E2E tests.
