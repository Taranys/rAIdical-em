## Context

The "Import from GitHub" button in `src/app/team/page.tsx` uses `<Button variant="outline">`, giving it a neutral style (border, transparent background). It does not stand out visually from other secondary actions and does not communicate its link to GitHub.

The project already uses `lucide-react` for icons and `shadcn/ui` for Button components with several available variants.

## Goals / Non-Goals

**Goals:**
- Make the button visually identifiable as a GitHub action
- Add the GitHub logo (`Github` icon from lucide-react) to the left of the text
- Use a dark style inspired by GitHub branding (dark background, white text)

**Non-Goals:**
- Create a new Button variant in the design system
- Modify the button's functional behavior
- Change other buttons on the page

## Decisions

**Use inline Tailwind classes rather than a new Button variant**
- The GitHub style is specific to this single button, not a reusable pattern
- Adding `className` on the Button with the desired colors is simpler
- Rejected alternative: create a `github` variant in `buttonVariants` — over-engineering for a single use

**Use the `Github` icon from lucide-react**
- Already available in the project (lucide-react is installed)
- Consistent with the rest of the project's iconography
- Rejected alternative: custom GitHub logo SVG — would add an asset to maintain

**Colors: `#24292e` background (GitHub dark) with white text**
- Uses GitHub's signature color, immediately recognizable
- Good text/background contrast for accessibility
- Hover state with a slightly lighter background

## Risks / Trade-offs

- [Inline classes override the variant] → Use `variant="default"` as base and apply `className` for specific colors
- [Dark mode consistency] → GitHub colors (dark background, white text) work naturally in dark mode as well
