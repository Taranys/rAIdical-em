# US-004: Set Up Development Workflow

**Phase:** 0 — Project Setup
**Status:** Done

## Story

As a contributor (human or AI), I want documented conventions and guidelines so that all contributions follow a consistent structure.

## Dependencies

None.

## Acceptance Criteria

- [x] `CLAUDE.md` exists at project root with:
  - Project overview
  - Tech stack summary
  - Common commands
  - Project structure description
  - Key conventions (Server Components default, DB access rules, import aliases)
- [x] Plan management convention defined (`docs/plan/` and `docs/plan_finished/`)
- [x] User story convention defined (`docs/user-stories/`)
- [x] `.gitignore` correctly excludes `node_modules/`, `data/`, `drizzle/`, `.env*`, `.next/`
- [x] `README.md` with quick-start instructions

## Plan and implementation details

### Test strategy (formerly Plan 001)

**Goal:** Establish a test-driven development workflow with Vitest (unit/integration) and Playwright (E2E), enforced via GitHub Actions CI on every PR.

**Tech Choices:**
- **Vitest** — unit and integration tests, fast TypeScript-native runner
- **Playwright** — E2E tests, Chromium only, runs against production build
- **GitHub Actions** — CI with 3 parallel jobs (lint, test-unit, test-e2e)

**Conventions:**
- TDD approach: Write tests before implementing features
- File naming: `*.test.ts` (unit/integration, colocated), `*.integration.test.ts` (integration), `*.spec.ts` (E2E in `e2e/`)
- Unit tests: At least one per new feature. Mock external dependencies.
- Integration tests: When they add value (DB queries, multi-module). Use in-memory SQLite.
- E2E tests: One per golden path. Run against production build.
- PR requirement: Every PR must include at least one new or updated unit test.

**Files created:**

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config (path aliases, environments) |
| `vitest.setup.ts` | Jest-DOM matchers setup |
| `playwright.config.ts` | Playwright config (webServer, Chromium) |
| `src/lib/utils.test.ts` | Unit tests for `cn()` utility |
| `src/db/health.test.ts` | Unit tests for `checkDbHealth()` (mocked DB) |
| `src/db/health.integration.test.ts` | Integration test (real in-memory SQLite) |
| `e2e/health.spec.ts` | E2E: homepage + health API golden paths |
| `.github/workflows/ci.yml` | CI workflow (lint, unit, e2e) |
