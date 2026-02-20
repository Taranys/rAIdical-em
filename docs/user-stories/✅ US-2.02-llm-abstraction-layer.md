# US-2.02: LLM Abstraction Layer

**Phase:** 2 — Review Quality Analysis
**Epic:** A — LLM Integration
**Status:** Done

## Story

As a developer, I want a provider-agnostic abstraction layer for LLM calls so that switching providers does not require changes across the codebase.

## Dependencies

- ✅ [US-2.01: Configure LLM Provider](✅%20US-2.01-configure-llm-provider.md) — provider config must be stored and retrievable

## Acceptance Criteria

- [x] A `LLMService` interface is defined with a `classify(prompt: string): Promise<LLMResponse>` method (and future extensibility)
- [x] Concrete implementations exist for OpenAI, Anthropic, and Google Gemini
- [x] A factory function returns the correct implementation based on the active provider in settings
- [x] Each implementation handles provider-specific authentication, request formatting, and response parsing
- [x] Rate limiting and retry logic (exponential backoff) are built into the base layer
- [x] Errors from the LLM API are caught and surfaced as typed errors (e.g., `LLMAuthError`, `LLMRateLimitError`, `LLMError`)
- [x] Unit tests cover the factory, retry logic, and error handling (LLM calls are mocked)

## Plan and implementation details

### Implementation plan

- Install SDKs: `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`
- Create `src/lib/llm/` module with types, retry, providers, factory, and barrel export
- TDD approach: write tests first for each module, then implement
- Replace mock test connection endpoint with real LLM call

### Implementation notes

- **Types** (`src/lib/llm/types.ts`): `LLMService` interface with `classify()`, `LLMResponse` with content + optional usage, typed errors (`LLMError`, `LLMAuthError`, `LLMRateLimitError`, `LLMNetworkError`)
- **Retry** (`src/lib/llm/retry.ts`): `withRetry()` — 3 attempts max, exponential backoff (1s/2s/4s), only retries on `LLMRateLimitError` and `LLMNetworkError`, injectable sleep for testing
- **OpenAI** (`src/lib/llm/providers/openai.ts`): Uses `chat.completions.create()`, maps SDK errors via HTTP status codes
- **Anthropic** (`src/lib/llm/providers/anthropic.ts`): Uses `messages.create()` with `max_tokens: 4096`, concatenates multiple text blocks, maps SDK errors via HTTP status codes
- **Google** (`src/lib/llm/providers/google.ts`): Uses `generateContent()`, maps `GoogleGenerativeAIFetchError` by status code, non-fetch errors become `LLMNetworkError`
- **Factory** (`src/lib/llm/factory.ts`): `createLLMService(config)` for direct use, `createLLMServiceFromSettings()` reads DB settings
- **Test connection** (`src/app/api/settings/llm-provider/test/route.ts`): Replaced mock with real SDK call via `createLLMServiceFromSettings()`, sends minimal prompt "Say hello in one word.", returns proper HTTP status codes for auth (401), rate limit (429), and other errors (500)
- 46 new unit tests added (8 retry + 8 OpenAI + 9 Anthropic + 9 Google + 7 factory + 5 test route)
