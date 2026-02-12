# US-2.01: Configure LLM Provider

**Phase:** 2 — Review Quality Analysis
**Epic:** A — LLM Integration
**Status:** Todo

## Story

As an engineering manager, I want to configure which LLM provider and model the application uses so that I can choose the provider that best fits my needs and budget.

## Acceptance Criteria

- [ ] The settings page has a new "AI / LLM" section
- [ ] Supported providers: OpenAI, Anthropic (Claude), Google (Gemini)
- [ ] For each provider, the user can enter an API key
- [ ] The API key is encrypted at rest (same approach as the GitHub PAT in US-005)
- [ ] A model selector shows available models for the selected provider (hardcoded list per provider, not fetched from API)
- [ ] A "Test connection" button sends a minimal prompt and displays success/failure
- [ ] The selected provider, model, and encrypted API key are stored in the `settings` table
- [ ] Only one provider is active at a time

## Dependencies

- [US-005: Configure GitHub PAT](005-configure-github-pat.md) — reuse encryption utilities and settings page patterns
- [US-022: Database Schema](022-database-schema-phase1.md) — settings table must exist
