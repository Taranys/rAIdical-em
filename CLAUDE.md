# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**em-control-tower** is a project to help manage team(s). It is in its initial stage with no source code yet.

- **License:** MIT
- **Author:** Yoann Prot

## Plans

- All implementation plans must be committed as Markdown files in `docs/plan/`.
- Naming convention: `NNN-short-description.md` (e.g., `001-auth-system.md`, `002-dashboard-ui.md`). Use the next available sequential number.
- When a plan is fully implemented, move it from `docs/plan/` to `docs/plan_finished/`, keeping the same filename.
- When you need context on a past feature, look in `docs/plan_finished/` first — the sequential ID and description make it easy to find relevant plans.
- Use plan IDs in code comments to link implementation back to the plan (e.g., `// Plan 001: auth token refresh logic`).
