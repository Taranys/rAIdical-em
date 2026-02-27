# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**rAIdical-em** is a dashboard for engineering managers to track team performance, review quality, and prepare better 1:1s.

- **License:** MIT
- **Author:** Yoann Prot

## User Stories

- All user stories live in `docs/user-stories/`.
- Naming convention: `<emoji> NNN-short-description.md`. Use the next available sequential number.
  - `✅` — Done (all acceptance criteria met)
  - `🏗️` — Ready to build (all dependencies are Done, implementation not started)
  - `❌` — Blocked (at least one dependency is not Done yet)
- **Phase 2+ naming:** `US-<phase>.<incremental>-short-description.md` — a semver-inspired format where `<phase>` is the phase number and `<incremental>` is a sequential ID within that phase (e.g., `US-2.01-configure-llm-provider.md`). The emoji prefix convention applies to these files too.
- **Legacy naming (Phase 0–1):** Older stories use the format `NNN-short-description.md` (e.g., `001-define-product-vision.md`). These are kept as-is for backward compatibility.
- Each file follows the template: title (`# US-NNN: Title`), phase, status (`Done` / `In Progress` / `Todo`), story (As a … I want … so that …), dependencies (with status emoji and markdown links), acceptance criteria (checklist), and a "Plan and implementation details" section.
- The "Plan and implementation details" section in each US contains the implementation plan (filled before starting work) and implementation notes (filled after completion). This replaces the old `docs/plan/` folder.
- **Status updates:** When a user story is fully implemented, update its status from `In Progress` (or `Todo`) to `Done` in the corresponding markdown file and check off all completed acceptance criteria.
- Use story IDs in code comments to link implementation back to the story (e.g., `// US-003: health check endpoint`).

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Framework:** Next.js (App Router, Server Components)
- **UI:** React + Tailwind CSS v4 + shadcn/ui
- **Database:** SQLite via better-sqlite3 (file: data/rAIdical-em.db)
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

## GitHub Issues

- Each user story has a corresponding GitHub issue. See `docs/github-issues-management.md` for the full mapping and label system.
- **PR descriptions:** When a PR implements a user story, include `Closes #<issue-number>` in the PR description to automatically close the issue when the PR is merged.
- When creating a new user story, create the corresponding GitHub issue following the process documented in `docs/github-issues-management.md`.

## Key Conventions

- **Base branch a jour:** Avant de demarrer une analyse, si ta base branch est `main`, verifie toujours qu'elle est a jour avec `origin/main` (via `git fetch origin main` puis comparaison ou `git pull`).
- **KISS:** Keep solutions simple. Avoid overengineering — prefer the simplest approach that works and refactor later when needed.
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

## Interaction Style

- **Langue:** Toutes les interactions doivent se faire en francais.
- **Roleplay D&D:** Agis comme un joueur de Donjons & Dragons. L'utilisateur est le Maitre du Jeu (MJ). Adopte un ton immersif et aventurier dans tes reponses, tout en restant efficace et precis dans ton travail de developpement.
