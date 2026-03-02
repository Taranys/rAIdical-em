## Context

The current PR authorship classification in `src/lib/ai-detection.ts` uses four independent heuristics: bot author list, branch name patterns, PR labels, and commit co-author patterns. Any "full signal" results in an "ai" classification, which conflates bot PRs (dependabot, renovate) with AI-assisted human work. Branch names and labels are unreliable proxies — a human PR on a branch named `claude/something` is tagged as "ai" even if every commit was written by a human.

The user wants a clearer model with four categories: `"bot"` for automated tools, `"ai"` for fully AI-assisted human work, `"mixed"` for partially AI-assisted, and `"human"` for purely human work.

## Goals / Non-Goals

**Goals:**
- Add `"bot"` as a new classification category for automated tool PRs
- Simplify classification to use only bot author list + commit co-author analysis
- Remove branch name and label heuristics entirely
- Simplify `AiHeuristicsConfig` accordingly
- Update dashboard UI to display the bot category
- Ensure backward compatibility: existing config and data are migrated gracefully

**Non-Goals:**
- Changing the database column name (`ai_generated` stays as-is for backward compatibility)
- Adding new detection signals (e.g., PR body analysis)
- Changing the dashboard layout or card structure

## Decisions

### 1. Four-category classification model

**Decision**: Expand `AiClassification` to `"ai" | "human" | "mixed" | "bot"`. Classification follows this priority:

1. If PR author is in bot list → `"bot"` (takes priority)
2. If all commits have AI co-authors → `"ai"`
3. If some commits have AI co-authors → `"mixed"`
4. Otherwise → `"human"`

**Rationale**: Bot PRs (dependabot, renovate) represent a fundamentally different kind of automation than AI-assisted human coding. Separating them gives EMs a clearer picture: "How much of my team's output is human, AI-assisted, or fully automated?"

**Alternative considered**: Keep 3 categories and put bots under "ai". Rejected because it obscures the distinction between a developer using Copilot and an automated dependency update.

### 2. Remove branch name and label heuristics

**Decision**: Delete the branch name pattern and label checks from `classifyPullRequest()`. Remove corresponding fields from `AiHeuristicsConfig`.

**Rationale**: These are unreliable proxies. A branch named `claude/*` doesn't mean the code was AI-written, and labels can be applied inconsistently. Commit co-authorship is the most direct signal of AI involvement, and bot author list is the most direct signal of automation.

### 3. Simplify `AiHeuristicsConfig`

**Decision**: Reduce the config to:
```typescript
interface AiHeuristicsConfig {
  coAuthorPatterns: string[];
  authorBotList: string[];
  enabled: {
    coAuthor: boolean;
    authorBot: boolean;
  };
}
```

**Rationale**: Two heuristics remain (co-author and bot author), each independently toggleable. Branch name patterns and labels are removed.

**Migration**: If a stored config has the old shape (with `branchNamePatterns`, `labels`, and extra `enabled` flags), extract the relevant fields. The settings API handles both shapes on read and always returns the new shape.

### 4. Keep `PrData` but simplify it

**Decision**: Keep `PrData` with only `author: string` (needed for bot detection). Remove `branchName` and `labels`.

**Rationale**: The classifier still needs the PR author to check against the bot list. Branch name and labels are no longer used.

### 5. Dashboard UI: add bot color

**Decision**: Add a fourth color for `"bot"` in the AI ratio chart. Use a distinct neutral/gray tone (`hsl(210 10% 58%)`) to distinguish bots from the human/ai/mixed color scheme.

**Rationale**: Bots are "neither human nor AI-assisted" in the team productivity sense. A neutral gray conveys that they're automated but separate from the human ↔ AI spectrum.

### 6. Re-classification happens naturally on next sync

**Decision**: Existing PRs get re-classified during the next GitHub sync. No separate migration script needed.

**Rationale**: The sync already upserts PRs and re-runs classification. Users who want immediate re-classification can trigger a manual sync.

## Risks / Trade-offs

- **[Breaking type change]** → `AiClassification` gains a 4th value. Any code doing exhaustive checks on the 3 existing values will need updating. The dashboard UI, DB queries, and API responses all need to handle `"bot"`.
- **[Breaking config change]** → Stored `ai_heuristics` settings in the old format will be migrated automatically. The settings API handles both shapes on read.
- **[Existing classifications change on re-sync]** → PRs previously classified as "ai" due to branch/label heuristics may become "human", "mixed", or "bot". This is the intended behavior.
- **[No DB migration needed]** → The `ai_generated` column is `TEXT`, so `"bot"` is a valid value without schema changes. Only the TypeScript types and column comment need updating.
