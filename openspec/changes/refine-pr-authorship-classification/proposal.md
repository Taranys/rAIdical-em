## Why

The current PR authorship classification uses multiple heuristics (bot author list, branch name patterns, AI labels, co-author patterns) which can lead to inconsistent and surprising results. For example, a PR created by a human on a branch named `claude/fix-typo` gets classified as "ai" even though the human wrote all the code. The classification should be simplified to focus on the most reliable signal: **commit authorship and co-authorship**. This makes the classification more intuitive and accurate for engineering managers tracking team AI adoption.

## What Changes

- **BREAKING**: Remove branch name pattern, PR label, and bot author heuristics from the classification logic. Classification will be based solely on commit author/co-author analysis.
- Redefine classification rules:
  - **"ai"**: All commits in the PR have at least one AI co-author (every commit was AI-assisted).
  - **"mixed"**: At least one commit has no AI co-author AND at least one commit has an AI co-author (some human-only work mixed with AI-assisted work).
  - **"human"**: No commits have an AI co-author (entirely human-authored).
- Simplify the `AiHeuristicsConfig` to only contain co-author patterns and their enabled flag.
- Update the settings API and UI to reflect the simplified configuration.
- Re-classify existing PRs on next sync to apply the new logic.

## Capabilities

### New Capabilities

- `commit-based-pr-classification`: PR authorship classification based exclusively on commit author and co-author analysis, replacing the multi-heuristic approach.

### Modified Capabilities

<!-- No existing specs are affected -->

## Impact

- `src/lib/ai-detection.ts` — Core classification logic rewrite
- `src/lib/ai-detection.test.ts` — Tests updated for new rules
- `src/lib/github-sync.ts` — Simplified data passed to classifier
- `src/lib/github-sync.test.ts` — Sync tests updated
- `src/app/api/settings/ai-heuristics/route.ts` — Simplified config API
- `src/app/api/settings/ai-heuristics/route.test.ts` — API tests updated
- Settings UI for AI heuristics configuration (simplified)
- Existing PRs in the database will be re-classified on next GitHub sync
