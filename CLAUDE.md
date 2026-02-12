# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**em-control-tower** is a dashboard for engineering managers to track team performance, review quality, and prepare better 1:1s.

- **License:** MIT
- **Author:** Yoann Prot

## User Stories

- All user stories live in `docs/user-stories/`.
- Naming convention: `NNN-short-description.md` (e.g., `001-define-product-vision.md`, `002-select-technical-stack.md`). Use the next available sequential number.
- Each file follows the template: title (`# US-NNN: Title`), phase, status (`Done` / `In Progress` / `Todo`), story (As a … I want … so that …), and acceptance criteria (checklist).
- Use story IDs in code comments to link implementation back to the story (e.g., `// US-003: health check endpoint`).
- When you need context on a feature, check `docs/user-stories/` — the sequential ID and description make it easy to find relevant stories.

## Plans

- All implementation plans must be committed as Markdown files in `docs/plan/`.
- Naming convention: `NNN-short-description.md` (e.g., `001-auth-system.md`, `002-dashboard-ui.md`). Use the next available sequential number.
- When a plan is fully implemented, move it from `docs/plan/` to `docs/plan_finished/`, keeping the same filename.
- When you need context on a past feature, look in `docs/plan_finished/` first — the sequential ID and description make it easy to find relevant plans.
- Use plan IDs in code comments to link implementation back to the plan (e.g., `// Plan 001: auth token refresh logic`).

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Framework:** Next.js (App Router, Server Components)
- **UI:** React + Tailwind CSS v4 + shadcn/ui
- **Database:** SQLite via better-sqlite3 (file: data/em-control-tower.db)
- **ORM:** Drizzle ORM
- **GitHub API:** Octokit (Phase 1)
- **Testing:** Vitest (unit/integration) + Playwright (E2E)

## Common Commands

- `npm run dev` -- Start local development server (Turbopack)
- `npm run build` -- Production build
- `npm run lint` -- Run ESLint
- `npm run db:generate` -- Generate Drizzle migrations
- `npm run db:migrate` -- Run Drizzle migrations
- `npm run db:studio` -- Open Drizzle Studio (DB browser)
- `npm test` -- Run all unit and integration tests (single run)
- `npm run test:watch` -- Run tests in watch mode (development)
- `npm run test:unit` -- Run unit tests only
- `npm run test:integration` -- Run integration tests only
- `npm run test:e2e` -- Run E2E tests (builds and serves the app first)
- `npm run test:e2e:ui` -- Run E2E tests with Playwright UI

## Project Structure

- `src/app/` -- Next.js App Router pages and layouts
- `src/app/api/` -- API route handlers
- `src/components/ui/` -- shadcn/ui components
- `src/db/` -- Database connection, schema, and utilities
- `docs/` -- Project documentation (vision, technical decisions)
- `data/` -- SQLite database file (gitignored)
- `drizzle/` -- Generated migration files (gitignored)
- `e2e/` -- Playwright E2E tests
- `.github/workflows/` -- CI workflow definitions

## Key Conventions

- Use Server Components by default; add "use client" only when needed
- Database access only in Server Components or API routes (never in client code)
- Import paths use the `@/` alias (maps to `src/`)
- shadcn/ui components live in `src/components/ui/`

## Testing Conventions

- **TDD approach:** Write tests before implementing features. Start with a failing test, then implement the feature to make it pass.
- **File naming:** Unit/integration tests use `*.test.ts` / `*.test.tsx`, colocated next to the file under test. Integration tests use `*.integration.test.ts`. E2E tests use `*.spec.ts` in the `e2e/` directory.
- **Unit tests:** At least one unit test for each new feature or module. Mock external dependencies (database, APIs).
- **Integration tests:** Write when they add value — particularly for database queries and multi-module interactions. Use in-memory SQLite (`:memory:`) instead of the project database.
- **E2E tests:** One E2E test per golden path (critical user journey). Tests run against a production build.
- **PR requirements:** Every PR must include at least one new or updated unit test. E2E tests required when the PR changes a golden path.
- **Test environments:** Server-side code tests run in `node` environment; component tests run in `jsdom`.
- **No coverage thresholds:** Tests must pass, but there is no enforced coverage minimum.
