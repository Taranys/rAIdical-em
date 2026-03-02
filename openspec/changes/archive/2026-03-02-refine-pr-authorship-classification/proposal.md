## Why

The current PR authorship classification uses multiple heuristics (bot author list, branch name patterns, AI labels, co-author patterns) which can lead to inconsistent and surprising results. For example, a PR created by a human on a branch named `claude/fix-typo` gets classified as "ai" even though the human wrote all the code. Additionally, bot PRs (dependabot, renovate) are lumped into the "ai" category, which conflates automated dependency management with AI-assisted human coding.

The classification should be restructured into four clear categories with simpler, more accurate rules based on the most reliable signals: commit co-authorship for AI detection, and a bot author list for bot detection.

## What Changes

- **BREAKING**: Restructure `AiClassification` from 3 values (`"ai" | "human" | "mixed"`) to 4 values (`"ai" | "human" | "mixed" | "bot"`).
- **BREAKING**: Remove branch name pattern and PR label heuristics from classification. Keep bot author list (for `"bot"` category) and commit co-author analysis (for `"ai"` / `"mixed"` / `"human"`).
- Redefine classification rules:
  - **"bot"**: The PR author is in the bot list (e.g., dependabot, renovate). Bot detection takes priority.
  - **"ai"**: All commits in the PR have at least one AI co-author (every commit was AI-assisted).
  - **"mixed"**: At least one commit has an AI co-author AND at least one commit has no AI co-author.
  - **"human"**: No commits have an AI co-author and the PR author is not a bot.
- Simplify `AiHeuristicsConfig`: remove branch name patterns and label lists, keep co-author patterns and bot author list.
- Add `"bot"` color to the dashboard AI ratio chart.
- Update the database column comment and types to include `"bot"`.
- Re-classify existing PRs on next sync to apply the new logic.

## Capabilities

### New Capabilities

- `commit-based-pr-classification`: PR authorship classification based on commit co-author analysis and bot author detection, replacing the multi-heuristic approach. Introduces a new `"bot"` category separate from AI-assisted work.

### Modified Capabilities

<!-- No existing specs are affected -->

## Impact

- `src/lib/ai-detection.ts` — Classification logic rewrite, `AiClassification` type updated
- `src/lib/ai-detection.test.ts` — Tests updated for new rules and bot category
- `src/lib/github-sync.ts` — Simplified data passed to classifier
- `src/lib/github-sync.test.ts` — Sync tests updated
- `src/db/schema.ts` — Column comment updated for new type
- `src/db/pull-requests.ts` — `PullRequestInput` type updated
- `src/app/ai-ratio-card.tsx` — Add bot color and display in chart
- `src/app/ai-ratio-card.test.tsx` — Update tests for bot category
- `src/app/api/settings/ai-heuristics/route.ts` — Simplified config API
- `src/app/api/settings/ai-heuristics/route.test.ts` — API tests updated
- `src/app/api/dashboard/ai-ratio/route.test.ts` — Updated for bot category
- Existing PRs in the database will be re-classified on next GitHub sync
