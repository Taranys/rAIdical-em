## 1. Schema & Migration

- [ ] 1.1 Add `classificationReason` column (nullable TEXT) to `pullRequests` in `src/db/schema.ts`
- [ ] 1.2 Generate Drizzle migration with `npm run db:generate`
- [ ] 1.3 Run migration with `npm run db:migrate`

## 2. Classification Logic

- [ ] 2.1 Change `classifyPullRequest` return type from `AiClassification` to `{ classification: AiClassification, reason: string }` in `src/lib/ai-detection.ts`
- [ ] 2.2 Generate human-readable reason strings for each classification path (bot, ai, mixed, human, no commits)
- [ ] 2.3 Update unit tests in `src/lib/ai-detection.test.ts` to expect structured return type and verify reason strings

## 3. Data Layer & Sync

- [ ] 3.1 Add `classificationReason` to `PullRequestInput` interface and `upsertPullRequest` in `src/db/pull-requests.ts`
- [ ] 3.2 Update `github-sync.ts` to destructure the new return type and pass `classificationReason` to upsert
- [ ] 3.3 Add new query `getPRDetailsByAuthor(author, startDate, endDate)` in `src/db/pull-requests.ts` returning individual PRs with `number`, `title`, `aiGenerated`, `classificationReason`, `createdAt`, `state`
- [ ] 3.4 Update integration tests in `src/db/pull-requests.integration.test.ts` for the new field and new query

## 4. API Endpoint

- [ ] 4.1 Create `src/app/api/dashboard/ai-ratio/details/route.ts` with `GET` handler accepting `author`, `startDate`, `endDate` query params
- [ ] 4.2 Return 400 if required params are missing, return `{ prs: [...] }` sorted by createdAt desc
- [ ] 4.3 Write API route test

## 5. UI — Expandable PR Details

- [ ] 5.1 Make chart bars clickable in `src/app/ai-ratio-card.tsx` — track selected author in state
- [ ] 5.2 Add collapsible panel below the chart that fetches and displays PRs for the selected author
- [ ] 5.3 Display each PR with: number, title, colored classification badge, and reason text (or fallback message if null)
- [ ] 5.4 Handle loading state with skeleton while fetching details
- [ ] 5.5 Handle toggle behavior (click same author closes, click different switches)

## 6. UI — Reclassify Button

- [ ] 6.1 Add a "Reclassifier" button in the `AiRatioCard` header (next to the title)
- [ ] 6.2 On click, POST to `/api/sync` without `sinceDate` to trigger full sync
- [ ] 6.3 Show loading spinner on the button and disable it during sync
- [ ] 6.4 Poll `GET /api/sync` to detect sync completion, then refresh chart data
- [ ] 6.5 Handle error states (sync already running 409, sync failure)

## 7. Validation

- [ ] 7.1 Run `npm test` and ensure all existing and new tests pass
- [ ] 7.2 Run `npm run build` and verify no TypeScript errors
- [ ] 7.3 Run `npm run lint` and fix any issues
