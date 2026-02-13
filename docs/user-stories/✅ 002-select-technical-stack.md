# US-002: Select Technical Stack

**Phase:** 0 — Project Setup
**Status:** Done

## Story

As a project maintainer, I want a documented technical decision comparing stack options so that the architecture choice is traceable and justified.

## Dependencies

None.

## Acceptance Criteria

- [x] A `docs/technical-decision.md` file exists with:
  - Project constraints (local-only, no DB install, single command start, dashboard UI)
  - At least two stack options evaluated with pros/cons
  - A comparison matrix scoring each option
  - A final recommendation with rationale
- [x] The selected stack is: TypeScript + Next.js (App Router) + SQLite (better-sqlite3) + Drizzle ORM + Tailwind CSS + shadcn/ui

## Plan and implementation details

No formal plan — this was a documentation-only story.
