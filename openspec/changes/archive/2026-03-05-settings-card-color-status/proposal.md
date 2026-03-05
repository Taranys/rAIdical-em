## Why

The settings page displays 5 configuration cards (GitHub PAT, Repositories, LLM Provider, Database Import, Database Reset) with identical white backgrounds regardless of their configuration state. Users must read each card's content to determine whether it's fully configured or still needs attention. Adding color-coded backgrounds — light green for configured cards and light orange for cards needing data — provides instant visual feedback, making it easy to spot what's done and what still needs setup at a glance.

## What Changes

- Add a visual status indicator via background color to each settings card:
  - **Light green background** when the card's configuration is complete (data is set)
  - **Light orange background** when the card still requires user input (needs data)
- Determine configuration status for each card:
  - **GitHub PAT**: configured when a valid PAT is saved
  - **Repositories**: configured when at least one repository is added
  - **LLM Provider**: configured when a provider, model, and API key are set
  - **Database Import**: neutral (always considered "configured" — it's an action card, not a config card)
  - **Database Reset**: neutral (always considered "configured" — it's an action card, not a config card)
- The color changes must respect the existing dark mode theme

## Capabilities

### New Capabilities
- `settings-card-status-color`: Visual color-coding of settings cards based on their configuration completeness (green = configured, orange = needs data)

### Modified Capabilities

_None — the existing `sidebar-config-status` capability is unaffected; it already tracks settings configuration state independently in the sidebar._

## Impact

- **Code affected**: Settings page (`src/app/settings/page.tsx`) and individual card components (`github-pat-form.tsx`, `repositories-card.tsx`, `llm-provider-form.tsx`, `database-import-form.tsx`, `database-reset-form.tsx`)
- **Styling**: New Tailwind background color classes or CSS custom properties for the green/orange card states, with dark mode variants
- **No API changes**: Configuration status is already available client-side within each card component (PAT state, repo count, LLM config fields)
- **No database changes**
- **No dependency additions**
