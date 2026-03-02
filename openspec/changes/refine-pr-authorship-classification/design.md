## Context

The current PR authorship classification in `src/lib/ai-detection.ts` uses four independent heuristics: bot author list, branch name patterns, PR labels, and commit co-author patterns. Any "full signal" (bot author, AI branch, AI label, or ALL commits with AI co-author) results in an "ai" classification. This approach can misclassify PRs — for instance, a human PR on a branch named `claude/something` is tagged as "ai" even if every commit was written by a human.

The user wants a simpler, more accurate model: classification should be based **exclusively on commit co-authorship**. This aligns with the real-world signal — AI tools like Claude Code and Copilot add `Co-Authored-By` trailers to commits they help produce.

## Goals / Non-Goals

**Goals:**
- Simplify `classifyPullRequest()` to use only commit co-author analysis
- Remove branch name, label, and bot author heuristics from classification logic
- Simplify `AiHeuristicsConfig` to only co-author-related settings
- Ensure backward compatibility: existing config is migrated gracefully
- Keep the `matchesGlob`, `matchesAnyGlob`, and `hasCoAuthorMatch` utility functions (they are still needed)

**Non-Goals:**
- Changing the `AiClassification` type values (`"ai" | "human" | "mixed"`)
- Modifying the database schema (the `ai_generated` column stays as-is)
- Changing the dashboard UI components (they consume the same classification values)
- Adding new detection signals (e.g., PR body analysis) — this is a simplification

## Decisions

### 1. Remove non-co-author heuristics entirely

**Decision**: Delete the bot author, branch name, and label checks from `classifyPullRequest()`. Remove corresponding fields from `AiHeuristicsConfig`.

**Rationale**: These heuristics are unreliable proxies. A branch named `claude/*` doesn't mean the code was AI-written, and a human PR can accidentally get an `ai-generated` label. Commit co-authorship is the most direct signal of AI involvement in code production.

**Alternative considered**: Keep the heuristics but make them contribute to "mixed" instead of "ai". Rejected because it adds complexity without accuracy — the user explicitly wants commit-based classification only.

### 2. Simplify `AiHeuristicsConfig`

**Decision**: Reduce the config to:
```typescript
interface AiHeuristicsConfig {
  coAuthorPatterns: string[];
  enabled: boolean;
}
```

**Rationale**: With only one heuristic remaining, the per-heuristic `enabled` map is unnecessary. A single `enabled` boolean suffices. The `coAuthorPatterns` array stays to allow customization of which co-author names are considered AI.

**Migration**: If a stored config has the old shape, extract `coAuthorPatterns` and `enabled.coAuthor` from it. The settings API PUT endpoint accepts both old and new shapes during a transition period, but GET always returns the new shape.

### 3. Simplify `PrData` interface

**Decision**: Remove `author`, `branchName`, and `labels` from `PrData` since they are no longer used for classification. The function only needs `CommitData[]` and the config.

**Rationale**: Dead code removal. The sync function in `github-sync.ts` still fetches this data for other purposes (e.g., storing PR author in DB) but doesn't need to pass it to the classifier.

### 4. Re-classification happens naturally on next sync

**Decision**: Existing PRs get re-classified during the next GitHub sync (the sync always re-processes all PRs in range). No separate migration script needed.

**Rationale**: The sync already upserts PRs and re-runs classification. Users who want immediate re-classification can trigger a manual sync.

## Risks / Trade-offs

- **[Breaking config change]** → Stored `ai_heuristics` settings in the old format will be migrated automatically. The settings API handles both shapes on write and always returns the new shape.
- **[Bot PRs no longer auto-detected as "ai"]** → PRs from dependabot/renovate won't be classified as "ai" unless their commits have AI co-authors. This is acceptable — bot PRs are a different concern from AI-assisted human work. If needed later, bot detection can be a separate dimension.
- **[Existing classifications change on re-sync]** → PRs previously classified as "ai" due to branch/label heuristics may become "human" or "mixed". This is the intended behavior — the old classification was inaccurate.
