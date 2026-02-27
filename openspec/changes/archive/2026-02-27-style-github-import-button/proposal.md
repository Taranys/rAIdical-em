## Why

The "Import from GitHub" button on the Team Members page currently uses the `outline` variant (simple border, transparent background), making it barely noticeable and failing to clearly communicate that it is a GitHub-related action. Adding the GitHub logo and distinctive colors will improve affordance and immediate recognition.

## What Changes

- Replace the `outline` variant of the "Import from GitHub" button with a colored style reflecting GitHub branding (dark background, white text)
- Add the GitHub icon/logo (via lucide-react `Github` icon) to the left of the button text
- The button remains functionally identical (opens the import sheet)

## Capabilities

### New Capabilities

- `github-import-button-style`: Distinctive visual style for the GitHub import button with logo and brand colors

### Modified Capabilities

<!-- No modified capabilities -->

## Impact

- `src/app/team/page.tsx`: Button component modification (variant, classes, icon addition)
- Existing dependency: `lucide-react` (already installed, provides the `Github` icon)
- No impact on APIs, database, or existing E2E tests
