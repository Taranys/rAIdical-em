## 1. Update sidebar status API

- [ ] 1.1 Update `src/app/api/sidebar-status/route.ts`: replace `hasSetting("github_repo")` with `listRepositories().length > 0` (import `listRepositories` from `@/db/repositories`)
- [ ] 1.2 Update `src/app/api/sidebar-status/route.ts`: add `hasSetting("llm_api_key")` to the `settingsConfigured` conjunction
- [ ] 1.3 Update unit tests in `src/app/api/sidebar-status/route.test.ts` to mock `listRepositories` instead of `hasSetting("github_repo")` for the repository check, and add test cases for LLM configuration

## 2. Update spec

- [ ] 2.1 Archive the delta spec into `openspec/specs/sidebar-config-status/spec.md` by applying the MODIFIED requirement (update `settings.configured` definition to match the new logic)

## 3. Verify

- [ ] 3.1 Run unit tests (`npm run test:unit`) and confirm all pass
- [ ] 3.2 Manual verification: start dev server, configure all three settings cards to green, confirm sidebar shows green check
