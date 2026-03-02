## 1. Update AI Detection Core

- [x] 1.1 Expand `AiClassification` type to `"ai" | "human" | "mixed" | "bot"`
- [x] 1.2 Simplify `AiHeuristicsConfig` — remove `branchNamePatterns`, `labels`, and their `enabled` flags; keep `coAuthorPatterns`, `authorBotList`, and `enabled: { coAuthor, authorBot }`
- [x] 1.3 Update `DEFAULT_AI_HEURISTICS` to the new simplified shape
- [x] 1.4 Simplify `PrData` — remove `branchName` and `labels`, keep only `author`
- [x] 1.5 Rewrite `classifyPullRequest()` with priority-based logic: bot check first, then commit co-author analysis
- [x] 1.6 Add legacy config migration helper: `migrateConfig(stored: unknown): AiHeuristicsConfig`

## 2. Update GitHub Sync

- [x] 2.1 Update `syncPullRequests()` to pass simplified `PrData` (author only) and commits to `classifyPullRequest()`
- [x] 2.2 Update `aiGenerated` type in sync to include `"bot"`
- [x] 2.3 Add legacy config migration when loading stored `ai_heuristics` setting

## 3. Update Database Types

- [x] 3.1 Update `PullRequestInput.aiGenerated` type to include `"bot"` in `src/db/pull-requests.ts`
- [x] 3.2 Update schema comment in `src/db/schema.ts` to document the 4 categories

## 4. Update Settings API

- [x] 4.1 Update `PUT /api/settings/ai-heuristics` to accept and validate the new config shape
- [x] 4.2 Update `GET /api/settings/ai-heuristics` to return the new shape (with legacy migration)

## 5. Update Dashboard UI

- [x] 5.1 Add `"bot"` color to `COLORS` map in `ai-ratio-card.tsx`
- [x] 5.2 Add bot count display in team total summary

## 6. Update Tests

- [x] 6.1 Rewrite `ai-detection.test.ts` — add bot classification tests, remove branch/label tests, update co-author tests
- [x] 6.2 Update `github-sync.test.ts` — adjust classification call expectations and add bot scenario
- [x] 6.3 Update `ai-heuristics/route.test.ts` — test new config shape and legacy migration
- [x] 6.4 Update `ai-ratio-card.test.tsx` — add bot category to test data
- [x] 6.5 Update `ai-ratio/route.test.ts` — add bot category to mock data
- [x] 6.6 Update `pull-requests.integration.test.ts` — test bot value in upsert

## 7. Verify

- [x] 7.1 Run full test suite (`npm test`) and fix any regressions
- [x] 7.2 Run lint (`npm run lint`) and fix any issues
