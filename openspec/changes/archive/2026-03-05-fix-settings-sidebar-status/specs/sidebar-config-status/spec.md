## MODIFIED Requirements

### Requirement: Sidebar status API endpoint
The system SHALL expose a `GET /api/sidebar-status` endpoint that returns the configuration status of each section in the Configuration group.

The response SHALL have the shape:
```json
{
  "settings": { "configured": boolean },
  "team": { "configured": boolean },
  "sync": { "hasRun": boolean, "status": "success" | "error" | "running" | null }
}
```

- `settings.configured` SHALL be `true` only when ALL of the following are true:
  - A GitHub PAT is configured (`github_pat` setting exists)
  - At least one repository exists in the `repositories` table
  - An LLM API key is configured (`llm_api_key` setting exists)
- `team.configured` SHALL be `true` when at least one team member exists.
- `sync.hasRun` SHALL be `true` when at least one sync run exists for the configured repository.
- `sync.status` SHALL reflect the status of the latest sync run, or `null` if no run exists.

#### Scenario: All sections are configured
- **WHEN** GitHub PAT is set, at least one repository exists in the repositories table, LLM API key is set, at least one team member exists, and a sync run exists with status "success"
- **THEN** the endpoint returns `settings.configured: true`, `team.configured: true`, `sync.hasRun: true`, `sync.status: "success"`

#### Scenario: No configuration exists
- **WHEN** no GitHub PAT is set, no repositories exist, no LLM API key is set, no team members exist, and no sync has ever run
- **THEN** the endpoint returns `settings.configured: false`, `team.configured: false`, `sync.hasRun: false`, `sync.status: null`

#### Scenario: Repositories exist but LLM not configured
- **WHEN** GitHub PAT is set and at least one repository exists but no LLM API key is set
- **THEN** `settings.configured` SHALL be `false`

#### Scenario: LLM configured but no repositories
- **WHEN** GitHub PAT is set and LLM API key is set but no repositories exist in the repositories table
- **THEN** `settings.configured` SHALL be `false`

#### Scenario: Legacy github_repo setting exists but no repositories in table
- **WHEN** GitHub PAT is set and the legacy `github_repo` setting exists but no entries in the `repositories` table
- **THEN** `settings.configured` SHALL be `false` (legacy setting is not used for this check)
