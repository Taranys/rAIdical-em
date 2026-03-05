## Context

The settings page displays 5 cards (GitHub PAT, Repositories, LLM Provider, Database Import, Database Reset) using shadcn/ui `Card` components. Each configuration card already tracks an `isConfigured` boolean internally. Currently all cards have the same white/dark background (`bg-card`), providing no visual cue about their configuration status.

The `Card` component in `src/components/ui/card.tsx` accepts a `className` prop that merges with its default classes via `cn()`, making it straightforward to override the background color per instance.

The sidebar already has a similar concept via `sidebar-config-status` spec, but that uses icons — this change focuses on card background colors within the settings page itself.

## Goals / Non-Goals

**Goals:**
- Provide instant visual feedback on each settings card's configuration state via background color
- Light green background for fully configured cards, light orange for cards needing data
- Support both light and dark mode with appropriate color variants
- Keep action-only cards (Database Import, Database Reset) neutral since they have no "configured" state

**Non-Goals:**
- Changing the sidebar status indicators (already handled by `sidebar-config-status`)
- Adding new API endpoints — all configuration state is already available client-side
- Adding animations or transitions to color changes (keep it simple)
- Modifying the base `Card` component — colors are applied per-instance via `className`

## Decisions

### Decision 1: Apply colors via Tailwind className on each Card instance

**Choice:** Pass conditional `className` to each `<Card>` based on its `isConfigured` state.

**Rationale:** The `Card` component already supports `className` merging via `cn()`. This requires zero changes to the shared Card component and keeps the logic local to each settings form.

**Alternative considered:** Creating a `StatusCard` wrapper component. Rejected because it adds unnecessary abstraction for what is a simple conditional class.

### Decision 2: Use Tailwind's green/orange with low opacity for backgrounds

**Choice:**
- Configured: `bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800`
- Needs data: `bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800`
- Neutral (action cards): no change (keep default `bg-card`)

**Rationale:** Using Tailwind's built-in color palette with very light shades (50 in light mode, 950 with opacity in dark mode) provides subtle visual distinction without clashing with existing text colors. The border color change reinforces the status.

**Alternative considered:** CSS custom properties for status colors. Rejected — the Tailwind approach is simpler and consistent with the existing codebase style.

### Decision 3: Lift isConfigured state to the settings page for Repositories and LLM cards

**Choice:** Each card component will expose its configuration status via a callback prop (similar to how `GitHubPatForm` already has `onPatChange`). The settings page will track the status for each card and pass the appropriate className.

**Rationale:** The settings page already tracks `isPatConfigured` state. Extending this pattern to repos and LLM keeps the coloring logic centralized in one place — the parent page.

**Alternative considered:** Each card component applies its own background color internally. This would work but scatters the visual logic. Centralizing in the parent makes it easier to ensure consistent styling and change colors in one place.

### Decision 4: Action cards (Database Import, Database Reset) remain neutral

**Choice:** The Database Import and Database Reset cards keep the default `bg-card` background — no green or orange.

**Rationale:** These are destructive/utility actions, not configuration items. They don't have a "configured vs needs data" state. Coloring them would be misleading.

## Risks / Trade-offs

- **[Subtle colors may not be visible enough]** → The combination of background + border color change should be sufficient. If needed, the shade intensity can be increased later.
- **[Loading flash]** → Cards start with no color and gain color once `isConfigured` is resolved from API calls. This is brief (~200ms) and consistent with the current behavior where configured-state-dependent UI already appears after load. No mitigation needed.
- **[Repo card requires counting repositories]** → The Repositories card loads its list via API. The "configured" state means `repositories.length > 0`. This data is already fetched on mount — no additional API call needed.
