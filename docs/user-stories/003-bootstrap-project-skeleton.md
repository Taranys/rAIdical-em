# US-003: Bootstrap Project Skeleton

**Phase:** 0 — Project Setup
**Status:** Done

## Story

As a developer, I want a working project skeleton with all chosen technologies wired together so that I can start building features immediately.

## Acceptance Criteria

- [ ] Next.js app initialised with App Router and TypeScript strict mode
- [ ] Tailwind CSS v4 configured and working
- [ ] shadcn/ui installed with at least one component (Card, Badge)
- [ ] SQLite database via better-sqlite3 auto-created at `data/em-control-tower.db` with WAL mode
- [ ] Drizzle ORM configured with migration commands (`db:generate`, `db:migrate`, `db:studio`)
- [ ] Octokit installed as a dependency (ready for Phase 1)
- [ ] `@/` path alias configured in tsconfig
- [ ] A homepage that verifies all stack components are working (tech check dashboard)
- [ ] A health check API route at `/api/health`
- [ ] `npm run dev` starts the app in a single command
