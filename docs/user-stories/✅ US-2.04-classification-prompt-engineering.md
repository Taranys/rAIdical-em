# US-2.04: Classification Prompt Engineering

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Done

## Story

As a developer, I want a well-tested prompt template for classifying review comments so that the LLM produces consistent and accurate categorizations.

## Dependencies

- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM service must be available

## Acceptance Criteria

- [x] A prompt template is defined that takes a review comment body (and optional context: file path, PR title, diff snippet) and returns a structured classification
- [x] The prompt instructs the LLM to return JSON with: `category` (one of the 8 defined categories), `confidence` (0–1 float), and `reasoning` (short explanation)
- [x] The 8 categories are: `bug_correctness`, `security`, `performance`, `readability_maintainability`, `nitpick_style`, `architecture_design`, `missing_test_coverage`, `question_clarification`
- [x] The prompt handles edge cases: very short comments ("LGTM", "+1"), bot-generated comments, multi-topic comments (pick the dominant category)
- [x] Response parsing validates the LLM output and falls back gracefully if the response is malformed
- [x] Unit tests cover prompt generation, response parsing, and edge cases (with mocked LLM responses)

## Plan and implementation details

### Implementation plan

- **Module location:** `src/lib/llm/classifier.ts` (colocated with the LLM abstraction layer)
- **Approach:** Pure functions — `buildClassificationPrompt()` builds the prompt string, `parseClassificationResponse()` validates and converts the LLM JSON output
- **Confidence conversion:** LLM returns float 0–1, parser converts to integer 0–100 via `Math.round()` for DB storage compatibility (US-2.03 schema)
- **Error handling:** Discriminated union (`ClassificationResult | ClassificationParseError`) — no exceptions thrown, caller decides behavior
- **No external dependencies:** Validation done manually (3 fields don't warrant zod/ajv)

### Implementation notes

**Files created:**
- `src/lib/llm/classifier.ts` — Types (`CommentCategory`, `ClassificationInput`, `ClassificationResult`, `ClassificationParseError`), `COMMENT_CATEGORIES` constant, `buildClassificationPrompt()`, `parseClassificationResponse()`, `isClassificationError()` type guard
- `src/lib/llm/classifier.test.ts` — 28 unit tests covering prompt generation (6), valid response parsing (8), invalid response parsing (10), type guard (2), categories constant (2)

**Files modified:**
- `src/lib/llm/index.ts` — Added barrel exports for all classifier types and functions

**Key design decisions:**
- Edge cases (LGTM, bot comments, multi-topic) handled by prompt instructions, not by parser logic — lets the LLM decide the classification
- Markdown code fences stripped defensively in parser, even though the prompt explicitly asks for no fences
- `ClassificationParseError` includes `rawContent` for debugging/logging by the caller (US-2.05)
