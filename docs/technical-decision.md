# Technical Decision — Stack Selection

**Status:** Proposal — awaiting decision
**Date:** 2026-02-12
**Context:** Phase 0 — Project setup & architecture decisions

---

## Constraints

These constraints come from the project requirements and current stage:

| Constraint | Rationale |
|---|---|
| **Local-only** | No cloud deployment for now; runs on the developer's machine |
| **No DB installation required** | The database must be embedded/file-based — no external process to install or manage |
| **Single command to start** | `npm start`, `make run`, or equivalent — zero ceremony |
| **Dashboard UI** | The vision describes a dashboard opened before 1:1s, not a CLI tool |
| **GitHub API integration** | Phase 1 requires fetching PRs, reviews, and comments |
| **LLM integration (Phase 2)** | Comment categorization and seniority profiling will likely need an LLM |

---

## Option A — TypeScript + Next.js + SQLite (via better-sqlite3)

| Layer | Choice |
|---|---|
| **Language** | TypeScript |
| **Framework** | Next.js (App Router) |
| **UI** | React + Tailwind CSS + shadcn/ui |
| **Database** | SQLite via `better-sqlite3` (single file, zero install) |
| **ORM** | Drizzle ORM |
| **GitHub API** | Octokit |
| **Start command** | `npm run dev` |

### Pros

- Full-stack in a single project — API routes and UI co-located
- Massive ecosystem: component libraries, charting (Recharts, Tremor), AI SDKs
- SQLite via better-sqlite3 is synchronous and fast — no external process
- shadcn/ui + Tailwind gives a polished dashboard look with minimal effort
- Easy to add LLM features later (Vercel AI SDK, LangChain.js)
- Hot-reload in development

### Cons

- Next.js brings complexity that may be overkill for a local-only tool
- Node.js native module (`better-sqlite3`) can have build issues on some systems
- Heavier node_modules footprint

---

## Option B — TypeScript + Vite + React + SQLite (via sql.js / wa-sqlite)

| Layer | Choice |
|---|---|
| **Language** | TypeScript |
| **Framework** | Vite (React SPA) + Express or Hono (API server) |
| **UI** | React + Tailwind CSS + shadcn/ui |
| **Database** | SQLite via `sql.js` (Wasm, zero native deps) or `better-sqlite3` |
| **ORM** | Drizzle ORM |
| **GitHub API** | Octokit |
| **Start command** | `npm run dev` (concurrently runs API + UI) |

### Pros

- Lighter than Next.js — Vite is fast to start and build
- Separating API and UI keeps responsibilities clean
- sql.js (Wasm) avoids native module issues entirely
- Same React/Tailwind/shadcn ecosystem for UI
- Hono is extremely lightweight as an API layer

### Cons

- Two processes to manage (API + UI), though `concurrently` handles it
- sql.js is slower than better-sqlite3 for large datasets
- More wiring needed compared to Next.js all-in-one

---

## Option C — Python + FastAPI + Streamlit + SQLite

| Layer | Choice |
|---|---|
| **Language** | Python |
| **Framework** | FastAPI (API) + Streamlit (dashboard UI) |
| **UI** | Streamlit built-in components + Plotly |
| **Database** | SQLite via Python stdlib (`sqlite3`) — zero install, built in |
| **ORM** | SQLModel or raw SQL |
| **GitHub API** | PyGitHub or httpx |
| **Start command** | `streamlit run app.py` |

### Pros

- SQLite is built into Python's standard library — literally zero dependencies for the DB
- Streamlit gives a dashboard UI with almost no frontend code
- Excellent for data-heavy dashboards (charts, tables, filters)
- Python has the strongest AI/ML ecosystem (LangChain, OpenAI SDK, transformers)
- Single command start with Streamlit
- Fast prototyping — less boilerplate than JS frameworks

### Cons

- Streamlit UI is less customizable than React — limited layout control
- Not a "real" web app — harder to evolve into a polished product later
- Two-language team skill requirement if contributors are JS-focused
- Streamlit reruns the entire script on interaction — can feel sluggish with large data

---

## Comparison Matrix

| Criteria | Option A (Next.js) | Option B (Vite + Hono) | Option C (Python + Streamlit) |
|---|:---:|:---:|:---:|
| **Single command start** | Yes | Yes (concurrently) | Yes |
| **No DB install** | Yes (SQLite file) | Yes (SQLite file) | Yes (stdlib) |
| **Local-only** | Yes | Yes | Yes |
| **Dashboard quality** | High | High | Medium |
| **Setup complexity** | Medium | Medium | Low |
| **LLM integration ease** | Good | Good | Best |
| **Prototyping speed** | Medium | Medium | Fast |
| **Long-term flexibility** | High | High | Medium |
| **Dependency footprint** | Heavy | Medium | Light |

---

## Open Questions

1. **Who will use / contribute to this project?** If it stays single-user (the EM), prototyping speed matters more than scalability.
2. **How important is UI polish?** If a Streamlit-grade UI is sufficient, Option C wins on speed. If a polished dashboard is needed, Option A or B.
3. **LLM provider preference?** All options support OpenAI/Anthropic APIs, but Python has more mature tooling for advanced prompting and evaluation.

---

## Recommendation

> To be filled after decision.

Selected option: **TBD**
Rationale: **TBD**
