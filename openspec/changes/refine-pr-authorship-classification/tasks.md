## 1. Simplify AI Detection Core

- [ ] 1.1 Simplify `AiHeuristicsConfig` interface to only `coAuthorPatterns: string[]` and `enabled: boolean`
- [ ] 1.2 Update `DEFAULT_AI_HEURISTICS` to the new simplified shape
- [ ] 1.3 Remove `PrData` interface (no longer needed — classification only uses commits)
- [ ] 1.4 Rewrite `classifyPullRequest()` to accept only `commits: CommitData[]` and `config: AiHeuristicsConfig`, using commit co-author analysis exclusively
- [ ] 1.5 Add legacy config migration helper: `migrateConfig(stored: unknown): AiHeuristicsConfig`

## 2. Update GitHub Sync

- [ ] 2.1 Update `syncPullRequests()` to pass only commits to `classifyPullRequest()` (remove `PrData` construction)
- [ ] 2.2 Add legacy config migration when loading stored `ai_heuristics` setting

## 3. Update Settings API

- [ ] 3.1 Update `PUT /api/settings/ai-heuristics` to accept and validate the new config shape
- [ ] 3.2 Update `GET /api/settings/ai-heuristics` to return the new shape (with legacy migration for stored old-format configs)

## 4. Update Tests

- [ ] 4.1 Rewrite `ai-detection.test.ts` — remove bot/branch/label tests, add commit-only classification tests per spec scenarios
- [ ] 4.2 Update `github-sync.test.ts` — adjust classification call expectations to new signature
- [ ] 4.3 Update `ai-heuristics/route.test.ts` — test new config shape and legacy migration

## 5. Verify

- [ ] 5.1 Run full test suite (`npm test`) and fix any regressions
- [ ] 5.2 Run lint (`npm run lint`) and fix any issues
