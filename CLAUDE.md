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

## Common Commands

- `npm run dev` -- Start local development server (Turbopack)
- `npm run build` -- Production build
- `npm run lint` -- Run ESLint
- `npm run db:generate` -- Generate Drizzle migrations
- `npm run db:migrate` -- Run Drizzle migrations
- `npm run db:studio` -- Open Drizzle Studio (DB browser)

## Project Structure

- `src/app/` -- Next.js App Router pages and layouts
- `src/app/api/` -- API route handlers
- `src/components/ui/` -- shadcn/ui components
- `src/db/` -- Database connection, schema, and utilities
- `docs/` -- Project documentation (vision, technical decisions)
- `data/` -- SQLite database file (gitignored)
- `drizzle/` -- Generated migration files (gitignored)

## Key Conventions

- Use Server Components by default; add "use client" only when needed
- Database access only in Server Components or API routes (never in client code)
- Import paths use the `@/` alias (maps to `src/`)
- shadcn/ui components live in `src/components/ui/`
