## Context

The sidebar status API endpoint (`GET /api/sidebar-status`) determines whether the Settings section is fully configured. It currently checks `hasSetting("github_pat") && hasSetting("github_repo")`. However, the app migrated from a single-repo model (stored in the `settings` table as `github_repo`) to a multi-repo model (stored in a dedicated `repositories` table). The LLM Provider card was also added later but never included in the sidebar status check. This causes the sidebar to show a warning icon even when all settings cards are green.

## Goals / Non-Goals

**Goals:**
- Align the sidebar status check with the actual settings page card states so that "all cards green" = "sidebar green"
- Keep the fix minimal and focused on the `settings.configured` evaluation logic

**Non-Goals:**
- Changing the API response shape (it stays `{ settings: { configured: boolean }, ... }`)
- Refactoring the sync status check (it still uses `github_owner`/`github_repo` settings and that's fine for now)
- Removing the legacy `github_repo` / `github_owner` settings (they're still used by sync)

## Decisions

### Use `listRepositories()` instead of `hasSetting("github_repo")`

The repositories card considers itself configured when `repositories.length > 0` (from the `repositories` table). The sidebar should use the same source of truth.

**Alternative considered**: Check both `hasSetting("github_repo") || listRepositories().length > 0` for backward compatibility. Rejected because it adds complexity for a case that shouldn't matter — the multi-repo migration is already done.

### Include LLM provider in the settings configured check

The settings page has three configuration cards: PAT, Repositories, LLM. The sidebar status should reflect all three. We add `hasSetting("llm_api_key")` to the conjunction.

**Alternative considered**: Keep LLM out of the sidebar check since it's "optional". Rejected because the user sees three cards and expects the sidebar emoji to reflect all of them.

## Risks / Trade-offs

- **[Risk] Sync status still uses legacy settings** → The sync route still reads `github_owner`/`github_repo` for `getLatestSyncRun`. This is unchanged and out of scope. A future change should migrate sync to the multi-repo model.
- **[Risk] LLM becoming mandatory for green sidebar** → Users who don't use LLM features will see a warning. This matches the settings page behavior where the LLM card is orange when unconfigured, so it's consistent.
