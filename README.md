# rAIdical-em

**Your engineering management cockpit.** Track team performance, sharpen review culture, and walk into every 1:1 prepared — backed by data, not gut feeling.

> Built with [VIBE Kanban](https://www.vibekanban.com/) | MIT License

---

## The problem

AI now writes a significant share of the code we ship. As an Engineering Manager, the skills you need to develop in your team have shifted: **the ability to critically review, challenge, and improve AI-generated code is becoming as important as writing code from scratch.**

But how do you know if your team is keeping up? How do you give feedback that's specific, timely, and grounded in observable facts?

Spreadsheets won't cut it. Gut feeling doesn't scale.

## The solution

rAIdical-em aggregates signals from the tools your team already uses (GitHub, and soon Slack, Confluence, Jira) into a **single dashboard** you open before every 1:1, every sprint review, every quarterly planning.

At a glance, you see:

- **Who's shipping what** — PRs opened, sizes, review activity per person
- **AI vs. human authorship** — how AI adoption evolves across the team
- **Review quality** — comment categorization, depth of feedback, seniority signals
- **Best moments to celebrate** — strong review comments to call out in your next 1:1
- **Growth opportunities** — where someone could have gone deeper, with concrete suggestions

---

## Core principles

| Principle | What it means |
|-----------|---------------|
| **Data informs, humans decide** | The tool surfaces signals. You own the judgment and the conversation. |
| **Radical Candor over radical surveillance** | The goal is growth, not control. Data feeds better feedback, never punishment. |
| **Privacy by default** | Interaction tracking is opt-in and transparent to the team. |
| **Start small, iterate** | Ship the foundation first. Expand when it's solid. |

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 0** | Project setup, vision, architecture decisions | Done |
| **Phase 1** | GitHub integration — PR metrics & review comment extraction | In progress |
| **Phase 2** | Comment categorization & seniority profiling (LLM-powered) | Planned |
| **Phase 3** | Highlight reel & 1:1 preparation dashboard | Planned |
| **Phase 4** | OKR-to-individual-goals engine | Future |
| **Phase 5** | Slack & Confluence integration | Future |

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's it. No database to install, no Docker, no external services. SQLite lives in a local file and Drizzle ORM handles migrations.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Framework | Next.js 16 (App Router, Server Components) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Database | SQLite via better-sqlite3 (zero install) |
| ORM | Drizzle ORM |
| GitHub API | Octokit |
| Testing | Vitest + Playwright |

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run all unit & integration tests |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Project structure

```
src/
  app/           Next.js App Router pages & layouts
  app/api/       API route handlers
  components/ui/ shadcn/ui components
  db/            Database connection, schema & utilities
docs/            Vision, technical decisions, user stories, plans
e2e/             Playwright E2E tests
data/            SQLite database file (gitignored)
drizzle/         Generated migrations (gitignored)
```

---

## Documentation

- [Vision](docs/vision.md) — why this project exists and where it's going
- [Technical decisions](docs/technical-decision.md) — stack selection rationale
- [User stories](docs/user-stories/) — all features, past and planned

---

## License

MIT — see [LICENSE](LICENSE).
