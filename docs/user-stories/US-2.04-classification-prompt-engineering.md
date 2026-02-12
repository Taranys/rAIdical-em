# US-2.04: Classification Prompt Engineering

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As a developer, I want a well-tested prompt template for classifying review comments so that the LLM produces consistent and accurate categorizations.

## Acceptance Criteria

- [ ] A prompt template is defined that takes a review comment body (and optional context: file path, PR title, diff snippet) and returns a structured classification
- [ ] The prompt instructs the LLM to return JSON with: `category` (one of the 8 defined categories), `confidence` (0–1 float), and `reasoning` (short explanation)
- [ ] The 8 categories are: `bug_correctness`, `security`, `performance`, `readability_maintainability`, `nitpick_style`, `architecture_design`, `missing_test_coverage`, `question_clarification`
- [ ] The prompt handles edge cases: very short comments ("LGTM", "+1"), bot-generated comments, multi-topic comments (pick the dominant category)
- [ ] Response parsing validates the LLM output and falls back gracefully if the response is malformed
- [ ] Unit tests cover prompt generation, response parsing, and edge cases (with mocked LLM responses)

## Dependencies

- [US-2.02: LLM Abstraction Layer](US-2.02-llm-abstraction-layer.md) — LLM service must be available
