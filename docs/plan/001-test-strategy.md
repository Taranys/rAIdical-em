# Plan 001: Test Strategy

## Goal

Establish a test-driven development workflow with Vitest (unit/integration) and Playwright (E2E), enforced via GitHub Actions CI on every PR.

## Tech Choices

- **Vitest** — unit and integration tests, fast TypeScript-native runner
- **Playwright** — E2E tests, Chromium only, runs against production build
- **GitHub Actions** — CI with 3 parallel jobs (lint, test-unit, test-e2e)

## Conventions

- **TDD approach:** Write tests before implementing features
- **File naming:** `*.test.ts` (unit/integration, colocated), `*.integration.test.ts` (integration), `*.spec.ts` (E2E in `e2e/`)
- **Unit tests:** At least one per new feature. Mock external dependencies.
- **Integration tests:** When they add value (DB queries, multi-module). Use in-memory SQLite.
- **E2E tests:** One per golden path. Run against production build.
- **PR requirement:** Every PR must include at least one new or updated unit test.

## Files Created

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

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added test devDependencies + 6 npm scripts |
| `tsconfig.json` | Excluded test configs from Next.js compilation |
| `.gitignore` | Added Playwright output directories |
| `CLAUDE.md` | Added testing conventions and commands |

## NPM Scripts

- `npm test` — Run all unit + integration tests
- `npm run test:watch` — Watch mode for development
- `npm run test:unit` — Unit tests only
- `npm run test:integration` — Integration tests only
- `npm run test:e2e` — E2E tests (builds + serves app)
- `npm run test:e2e:ui` — E2E with Playwright UI

## Status

Implemented.
