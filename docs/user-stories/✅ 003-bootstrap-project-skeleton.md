# US-003: Bootstrap Project Skeleton

**Phase:** 0 — Project Setup
**Status:** Done

## Story

As a developer, I want a working project skeleton with all chosen technologies wired together so that I can start building features immediately.

## Dependencies

None.

## Acceptance Criteria

- [x] Next.js app initialised with App Router and TypeScript strict mode
- [x] Tailwind CSS v4 configured and working
- [x] shadcn/ui installed with at least one component (Card, Badge)
- [x] SQLite database via better-sqlite3 auto-created at `data/rAIdical-em.db` with WAL mode
- [x] Drizzle ORM configured with migration commands (`db:generate`, `db:migrate`, `db:studio`)
- [x] Octokit installed as a dependency (ready for Phase 1)
- [x] `@/` path alias configured in tsconfig
- [x] A homepage that verifies all stack components are working (tech check dashboard)
- [x] A health check API route at `/api/health`
- [x] `npm run dev` starts the app in a single command

## Plan and implementation details

No formal plan — bootstrapped via `create-next-app` and manual wiring.
