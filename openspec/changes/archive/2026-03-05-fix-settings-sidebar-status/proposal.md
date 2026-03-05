## Why

The Settings sidebar status indicator shows a warning (amber) icon even when all three settings cards (GitHub PAT, Repositories, LLM Provider) are properly configured and display green. This happens because the `/api/sidebar-status` endpoint uses a legacy check (`hasSetting("github_pat") && hasSetting("github_repo")`) that doesn't match how the settings page actually determines configuration status:

1. **Repositories mismatch**: The sidebar checks for a legacy `github_repo` setting key, but the app now uses a multi-repo `repositories` table. Users add repos through the Repositories card which writes to the `repositories` table, not to the `github_repo` setting.
2. **LLM Provider ignored**: The sidebar status doesn't check LLM configuration at all, while the settings page has a dedicated LLM Provider card with its own configured/unconfigured state.

## What Changes

- Update the `/api/sidebar-status` endpoint to check repository configuration using `listRepositories().length > 0` instead of `hasSetting("github_repo")`
- Include LLM provider configuration in the settings configured check: `hasSetting("llm_api_key")`
- Update the existing `sidebar-config-status` spec to reflect the corrected definition of "settings configured"
- Update existing unit tests to match the new logic

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `sidebar-config-status`: The definition of `settings.configured` changes from "GitHub PAT + legacy github_repo setting" to "GitHub PAT + at least one repository in repositories table + LLM API key configured"

## Impact

- **API**: `GET /api/sidebar-status` — response shape unchanged, but `settings.configured` evaluates differently
- **Code**: `src/app/api/sidebar-status/route.ts` and its unit tests
- **Spec**: `openspec/specs/sidebar-config-status/spec.md` requirement update
- **No breaking changes**: The API contract (shape) remains the same; only the evaluation logic changes
