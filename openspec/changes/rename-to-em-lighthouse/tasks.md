## 1. Configuration Files

- [ ] 1.1 Update `package.json` name from `rAIdical-em` to `em-lighthouse`
- [ ] 1.2 Regenerate `package-lock.json` to reflect the new package name
- [ ] 1.3 Update `drizzle.config.ts` database URL from `rAIdical-em.db` to `em-lighthouse.db`

## 2. Database & Core

- [ ] 2.1 Update `DB_PATH` in `src/db/index.ts` from `rAIdical-em.db` to `em-lighthouse.db`
- [ ] 2.2 Update database path references in `src/db/health.ts`
- [ ] 2.3 Update database path in `scripts/db-snapshot.mjs`
- [ ] 2.4 Update encryption key derivation string in `src/lib/crypto.ts` from `"rAIdical-em"` to `"em-lighthouse"`

## 3. UI & Metadata

- [ ] 3.1 Update sidebar title in `src/components/app-sidebar.tsx` to "EM Lighthouse"
- [ ] 3.2 Update page title and description in `src/app/layout.tsx` to "EM Lighthouse"
- [ ] 3.3 Update error message in `src/app/api/settings/database/import/route.ts`

## 4. Tests

- [ ] 4.1 Update sidebar test assertion in `src/components/app-sidebar.test.tsx`
- [ ] 4.2 Update database mock paths in `src/app/api/settings/database/import/route.test.ts`
- [ ] 4.3 Update database mock paths in `src/app/api/settings/database/reset/route.test.ts`
- [ ] 4.4 Update E2E test assertion in `e2e/navigation.spec.ts`

## 5. Documentation

- [ ] 5.1 Update `README.md` project name and references
- [ ] 5.2 Update `CLAUDE.md` project description
- [ ] 5.3 Update `docs/vision.md` references
- [ ] 5.4 Update `docs/github-issues-management.md` references
- [ ] 5.5 Update user story files that reference "rAIdical-em"

## 6. Verification

- [ ] 6.1 Run grep across the codebase to confirm zero "rAIdical-em" references remain (excluding openspec/changes/archive/ and .git/)
- [ ] 6.2 Run `npm test` to verify all unit/integration tests pass
- [ ] 6.3 Run `npm run build` to verify the production build succeeds
