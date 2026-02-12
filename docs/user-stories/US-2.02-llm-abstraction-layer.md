# US-2.02: LLM Abstraction Layer

**Phase:** 2 — Review Quality Analysis
**Epic:** A — LLM Integration
**Status:** Todo

## Story

As a developer, I want a provider-agnostic abstraction layer for LLM calls so that switching providers does not require changes across the codebase.

## Acceptance Criteria

- [ ] A `LLMService` interface is defined with a `classify(prompt: string): Promise<LLMResponse>` method (and future extensibility)
- [ ] Concrete implementations exist for OpenAI, Anthropic, and Google Gemini
- [ ] A factory function returns the correct implementation based on the active provider in settings
- [ ] Each implementation handles provider-specific authentication, request formatting, and response parsing
- [ ] Rate limiting and retry logic (exponential backoff) are built into the base layer
- [ ] Errors from the LLM API are caught and surfaced as typed errors (e.g., `LLMAuthError`, `LLMRateLimitError`, `LLMError`)
- [ ] Unit tests cover the factory, retry logic, and error handling (LLM calls are mocked)

## Dependencies

- [US-2.01: Configure LLM Provider](US-2.01-configure-llm-provider.md) — provider config must be stored and retrievable
