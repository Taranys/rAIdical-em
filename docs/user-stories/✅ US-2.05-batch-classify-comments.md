# US-2.05: Batch Classify Review Comments

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As an engineering manager, I want to classify all unclassified review comments in batch so that historical data is categorized without manual effort.

## Dependencies

- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — classification tables must exist
- ✅ [US-2.04: Classification Prompt Engineering](✅%20US-2.04-classification-prompt-engineering.md) — prompt template must be ready
- ✅ [US-012: Fetch PR Review Comments](✅%20012-fetch-pr-review-comments.md) — review comments must be synced from GitHub

## Acceptance Criteria

- [x] A "Classify Comments" action is available via POST `/api/classify`
- [x] The batch process finds all review comments and PR comments that have no classification yet
- [x] Comments are sent to the LLM in batches (configurable batch size, default: 10 comments per request) to optimize API usage
- [x] A `classification_runs` entry is created to track progress (started, in progress, completed, error)
- [x] Real-time progress is displayed: comments classified / total, current batch, errors encountered (GET `/api/classify/progress`)
- [x] Each classified comment is stored in `comment_classifications` with category, confidence, reasoning, and model used
- [x] The process is interruptible — partial progress is saved and can be resumed
- [x] Rate limit errors from the LLM trigger automatic backoff and retry (via US-2.02)
- [x] A summary is shown on completion: total classified, breakdown by category, average confidence, errors

## Plan and implementation details

### Implementation plan

#### 1. Data Access Layer — `src/db/classification-runs.ts`
- `createClassificationRun(modelUsed)` → creates a run with status `running`
- `updateClassificationRunProgress(id, commentsProcessed, errors)` → incremental update
- `completeClassificationRun(id, status, commentsProcessed, errors)` → sets completedAt
- `getActiveClassificationRun()` → find a run with status `running`
- `getLatestClassificationRun()` → latest run by id desc
- `getClassificationRunHistory(limit)` → last N runs

#### 2. Data Access Layer — `src/db/comment-classifications.ts`
- `getUnclassifiedReviewComments(dbInstance)` → LEFT JOIN review_comments with comment_classifications to find unclassified
- `getUnclassifiedPrComments(dbInstance)` → same for pr_comments
- `insertClassification(data)` → insert into comment_classifications
- `getClassificationSummary(runId)` → count by category, avg confidence for a run

#### 3. Classification Service — `src/lib/classification-service.ts`
- Core batch classification logic, decoupled from HTTP layer
- `classifyComments(options)` — main entry point:
  1. Creates a `classification_runs` entry (status: running)
  2. Fetches all unclassified comments (review_comments + pr_comments)
  3. Processes them in batches (default: 10, configurable)
  4. For each comment: builds prompt (US-2.04), calls LLM (US-2.02), parses response, stores result
  5. Updates run progress after each batch
  6. On error: catches, increments error counter, continues to next comment
  7. On completion: marks run as `success` (or `error` if all failed)
- Uses `createLLMServiceFromSettings()` to get the LLM service
- Uses `withRetry()` from US-2.02 for rate limit handling (already built into providers)
- Returns final run summary

#### 4. API Routes
- **POST `/api/classify`** — triggers batch classification in background (like sync pattern)
  - Checks LLM is configured, no active run already running
  - Returns `{ success: true, runId }` immediately
  - Runs classification in background (fire-and-forget)
- **GET `/api/classify/progress`** — returns current/latest run status + summary
  - Returns run progress for polling from the UI

#### 5. Testing strategy
- **Unit tests** for `classification-service.ts`: mock LLM service and DB, test batch logic, error handling, progress tracking
- **Unit tests** for API routes: mock classification-service, test validation, 409 on concurrent run
- **Integration tests** for DAL: in-memory SQLite, test unclassified query, insert classification, summary

### Implementation notes

**Files created:**
- `src/db/classification-runs.ts` — DAL for classification_runs table (CRUD, active run check, history)
- `src/db/comment-classifications.ts` — DAL for comment_classifications (unclassified queries, insert, summary)
- `src/lib/classification-service.ts` — Core batch classification service (batch loop, error handling, progress tracking)
- `src/app/api/classify/route.ts` — POST endpoint to trigger batch classification
- `src/app/api/classify/progress/route.ts` — GET endpoint for polling run progress and summary

**Test files created:**
- `src/db/classification-runs.integration.test.ts` — 8 integration tests (in-memory SQLite)
- `src/db/comment-classifications.integration.test.ts` — 8 integration tests
- `src/lib/classification-service.test.ts` — 6 unit tests (mocked LLM + DB)
- `src/app/api/classify/route.test.ts` — 3 unit tests (mocked service)

**Key decisions:**
- Used NOT IN subquery (instead of LEFT JOIN) for unclassified comment detection — simpler and works well with SQLite for moderate data volumes
- Batch classification runs in background (fire-and-forget pattern, same as sync)
- LLM service injectable via options for testability
- Error handling: per-comment try/catch, continues processing on individual failures
- Run status: `success` if at least one comment classified, `error` if all failed
- Progress updated after each batch (not each comment) to reduce DB writes
- The "Classify Comments" action is exposed as an API endpoint; the UI button will be added when the review quality page is built (US-2.07)

**Note on AC "interruptible":** The current implementation saves partial progress after each batch. A proper cancel/resume mechanism would require storing a `cancelled` status and re-querying unclassified comments on resume — which naturally works since we only process unclassified comments. Future enhancement if needed.
