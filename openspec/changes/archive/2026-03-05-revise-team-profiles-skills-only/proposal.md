## Why

Team Profiles currently display three types of dimensions: technical category skills (security, architecture…), soft skills (pedagogy, boldness…), and auto-detected programming languages (typescript, python…). The language dimensions clutter profiles with low-signal data that doesn't reflect defined competencies—they're just derived from file extensions in reviewed PRs. The profiles should focus exclusively on the skills explicitly defined in the seniority dimensions configuration.

## What Changes

- **Remove per-language seniority profiles** from computation: the `computeSeniorityProfiles` service will no longer generate language-based dimensions (typescript, python, ruby, etc.)
- **Remove language dimension data from the UI**: Team Profiles cards and radar charts will only display dimensions defined in `TECHNICAL_CATEGORY_DIMENSIONS` and `SOFT_SKILL_DIMENSIONS`
- **Clean up language detection usage in seniority**: the language detection utility itself remains (it may be used elsewhere), but seniority profile computation stops using it for per-language profiles
- **Remove stale language-based profiles** from the database on next recomputation

## Capabilities

### New Capabilities

- `skills-only-profiles`: Filter Team Profiles to display only dimensions defined in the seniority dimensions configuration (technical categories + soft skills), excluding auto-detected language dimensions

### Modified Capabilities


## Impact

- `src/lib/seniority-profile-service.ts` — Remove per-language profile computation logic
- `src/lib/seniority-dimensions.ts` — Potential cleanup of language-related exports if unused
- `src/app/team-profiles/team-profiles-content.tsx` — Filter displayed dimensions to defined skills only
- `src/app/team-profiles/seniority-radar-chart.tsx` — Radar chart data filtered to defined dimensions
- `src/app/api/team-profiles/route.ts` — API may filter out language dimensions or return as-is (UI handles filtering)
- `src/db/seniority-profiles.ts` — Potential cleanup of stale language profiles on recompute
