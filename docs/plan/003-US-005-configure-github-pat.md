# Plan 003: US-005 — Configure GitHub Personal Access Token

## Goal

Implement GitHub PAT configuration: encryption module, settings data access, API routes, settings page form, and dashboard CTA when no PAT is configured.

## Steps

1. **Crypto module** (`src/lib/crypto.ts`) — AES-256-GCM encrypt/decrypt using Node.js `crypto`, key derived from `os.hostname()` + fixed salt via PBKDF2.
2. **Settings DAL** (`src/db/settings.ts`) — `getSetting`, `setSetting`, `deleteSetting`, `hasSetting` with auto-encryption for the `github_pat` key. Dependency injection for testability.
3. **API routes** — `GET/PUT/DELETE /api/settings/github-pat` + `POST /api/settings/github-pat/test` (Octokit connection test).
4. **PAT form component** (`src/app/settings/github-pat-form.tsx`) — Client component with password input, save/test/delete, link to generate PAT with permissions list.
5. **Settings page** (`src/app/settings/page.tsx`) — Server Component wrapper rendering the form.
6. **Dashboard CTA** (`src/app/github-setup-cta.tsx`) — Server Component, amber card with link to `/settings` when no PAT configured.
7. **Dashboard page** (`src/app/page.tsx`) — Added CTA component above tech stack grid.
8. **E2E test** (`e2e/settings.spec.ts`) — Verifies settings page structure and dashboard CTA.

## Key Files

| File | Action |
|------|--------|
| `src/lib/crypto.test.ts` | Created |
| `src/lib/crypto.ts` | Created |
| `src/db/settings.integration.test.ts` | Created |
| `src/db/settings.ts` | Created |
| `src/app/api/settings/github-pat/route.ts` | Created |
| `src/app/api/settings/github-pat/test/route.ts` | Created |
| `src/app/settings/github-pat-form.test.tsx` | Created |
| `src/app/settings/github-pat-form.tsx` | Created |
| `src/app/settings/page.tsx` | Modified |
| `src/app/github-setup-cta.test.tsx` | Created |
| `src/app/github-setup-cta.tsx` | Created |
| `src/app/page.tsx` | Modified |
| `e2e/settings.spec.ts` | Created |
