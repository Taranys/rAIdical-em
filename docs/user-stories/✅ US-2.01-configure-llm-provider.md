# US-2.01: Configure LLM Provider

**Phase:** 2 — Review Quality Analysis
**Epic:** A — LLM Integration
**Status:** Done

## Story

As an engineering manager, I want to configure which LLM provider and model the application uses so that I can choose the provider that best fits my needs and budget.

## Dependencies

- ✅ [US-005: Configure GitHub PAT](✅%20005-configure-github-pat.md) — reuse encryption utilities and settings page patterns
- ✅ [US-022: Database Schema](✅%20022-database-schema-phase1.md) — settings table must exist

## Acceptance Criteria

- [x] The settings page has a new "AI / LLM" section
- [x] Supported providers: OpenAI, Anthropic (Claude), Google (Gemini)
- [x] For each provider, the user can enter an API key
- [x] The API key is encrypted at rest (same approach as the GitHub PAT in US-005)
- [x] A model selector shows available models for the selected provider (hardcoded list per provider, not fetched from API)
- [x] A "Test connection" button sends a minimal prompt and displays success/failure
- [x] The selected provider, model, and encrypted API key are stored in the `settings` table
- [x] Only one provider is active at a time

## Plan and implementation details

### Implementation plan

- Install shadcn/ui Select component
- Create `src/lib/llm-providers.ts` with provider/model definitions (OpenAI, Anthropic, Google) and validation helpers
- Add `llm_api_key` to encrypted keys in `src/db/settings.ts`
- Create API route `src/app/api/settings/llm-provider/route.ts` (GET/PUT/DELETE) storing 3 keys: `llm_provider`, `llm_model`, `llm_api_key`
- Create API route `src/app/api/settings/llm-provider/test/route.ts` (POST) with mock test connection (real SDK calls deferred to US-2.02)
- Create `src/app/settings/llm-provider-form.tsx` client component with provider Select, model Select, API key Input, Save/Test/Delete buttons
- Add `<LlmProviderForm />` to settings page

### Implementation notes

- Follows same patterns as GitHub PAT form (US-005): Card layout, feedback messages, loading states
- 3 settings keys used: `llm_provider` (plain), `llm_model` (plain), `llm_api_key` (encrypted via ENCRYPTED_KEYS set)
- GET endpoint never returns the API key for security
- Model list resets when provider changes
- Test connection is a mock that verifies configuration exists — real SDK calls will be added in US-2.02 (LLM Abstraction Layer)
- Models hardcoded: GPT-4o/4o-mini/4-turbo/o1/o1-mini/o3-mini (OpenAI), Claude Sonnet 4.5/Opus 4.6/Haiku 4.5 (Anthropic), Gemini 2.0 Flash/Flash Lite/1.5 Pro (Google)
