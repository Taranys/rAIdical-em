# em-control-tower

Engineering Manager Control Tower -- a dashboard to track team performance, review quality, and prepare better 1:1s.

> A POC built with [VIBE Kanban](https://www.vibekanban.com/).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| Framework | Next.js (App Router) |
| UI | React + Tailwind CSS + shadcn/ui |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| GitHub API | Octokit |

## Project Status

See [docs/vision.md](docs/vision.md) for the full project vision and [docs/technical-decision.md](docs/technical-decision.md) for architecture decisions.

| Phase | Status |
|-------|--------|
| Phase 0 -- Setup & architecture | Current |
| Phase 1 -- GitHub integration | Planned |
| Phase 2 -- Comment categorization | Planned |
| Phase 3 -- 1:1 preparation dashboard | Planned |

## License

MIT -- see [LICENSE](LICENSE).
