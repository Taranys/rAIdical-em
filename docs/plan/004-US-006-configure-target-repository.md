# Plan 004: US-006 — Configure Target GitHub Repository

## Goal

Allow the engineering manager to specify a GitHub owner (org or user) and repository to track, with searchable repository selection and verification.

## Design Decisions

- **Owner field**: Free text input (not searchable). Users know their org name; the Verify action catches typos.
- **Repository field**: Text input with debounced search dropdown (300ms). Uses GitHub search API with `user:{owner}` qualifier.
- **Settings keys**: `github_owner` and `github_repo` — plain text (not encrypted).
- **PAT dependency**: Repo form checks PAT status on mount; shows disabled message if no PAT configured.

## Implementation Steps

1. **Add shadcn/ui components**: `popover`, `label` via CLI
2. **API: CRUD** `GET/PUT/DELETE /api/settings/github-repo` — read/save/delete owner+repo
3. **API: Search** `GET /api/settings/github-repos?owner=X&q=Y` — search repos via Octokit
4. **API: Verify** `POST /api/settings/github-repo/verify` — verify repo accessibility via Octokit
5. **Client component** `GitHubRepoForm` — owner input, searchable repo input, verify/save/delete
6. **Settings page** — add `GitHubRepoForm` below `GitHubPatForm`
7. **Integration tests** — verify `github_owner` and `github_repo` stored as plain text
8. **E2E tests** — verify settings page shows repo form, PAT-required message, fields with PAT

## Files Created/Modified

| File | Action |
|------|--------|
| `src/components/ui/popover.tsx` | Created (shadcn CLI) |
| `src/components/ui/label.tsx` | Created (shadcn CLI) |
| `src/app/api/settings/github-repo/route.ts` | Created |
| `src/app/api/settings/github-repo/route.test.ts` | Created |
| `src/app/api/settings/github-repos/route.ts` | Created |
| `src/app/api/settings/github-repos/route.test.ts` | Created |
| `src/app/api/settings/github-repo/verify/route.ts` | Created |
| `src/app/api/settings/github-repo/verify/route.test.ts` | Created |
| `src/app/settings/github-repo-form.tsx` | Created |
| `src/app/settings/github-repo-form.test.tsx` | Created |
| `src/app/settings/page.tsx` | Modified |
| `src/db/settings.integration.test.ts` | Modified |
| `e2e/settings.spec.ts` | Modified |
