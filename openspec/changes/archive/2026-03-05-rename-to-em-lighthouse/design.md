## Context

The project is currently branded as "rAIdical-em" across ~22 files. References span configuration (`package.json`, `drizzle.config.ts`), source code (database paths, UI components, crypto), tests, and documentation. The database file is named `data/rAIdical-em.db`. The encryption key derivation in `src/lib/crypto.ts` includes the string "rAIdical-em".

## Goals / Non-Goals

**Goals:**
- Replace all "rAIdical-em" references with "EM Lighthouse" (display) or `em-lighthouse` (slugs/filenames)
- Ensure the application boots and passes all tests after renaming
- Provide a clear migration path for the database file rename

**Non-Goals:**
- Renaming the GitHub repository or changing the git remote URL
- Changing the directory name `em-control-tower/` (managed externally)
- Creating a logo or visual branding assets
- Renaming the OpenSpec archived changes that reference the old name

## Decisions

### 1. Database file rename strategy
**Decision**: Rename `data/rAIdical-em.db` to `data/em-lighthouse.db` in code. Document that existing users must rename the file manually.
**Rationale**: Automatic migration adds complexity for a dev tool with a single user. A note in the README is sufficient.

### 2. Encryption key derivation
**Decision**: Update the string from `"rAIdical-em"` to `"em-lighthouse"` in `src/lib/crypto.ts`.
**Rationale**: The crypto key is derived from `hostname() + project-name`. Changing it means previously encrypted values (API tokens stored in DB) will not decrypt. Since this is a development tool and tokens can be re-entered in settings, this is acceptable. Document this as a breaking change.

### 3. Naming convention
**Decision**: Use "EM Lighthouse" for human-readable display and `em-lighthouse` for technical identifiers (package name, database file, slugs).
**Rationale**: Consistent with standard conventions — display name uses title case, technical names use kebab-case.

### 4. Scope of documentation updates
**Decision**: Update all docs that contain "rAIdical-em" but preserve user story content as historical record (only update the title/branding, not rewrite the stories).
**Rationale**: User stories are historical artifacts; changing their substance would lose project history.

## Risks / Trade-offs

- **[Breaking encryption]** Changing the crypto derivation string invalidates all stored encrypted values (GitHub tokens) → Users must re-enter their API tokens in settings after the rename. Document in README.
- **[Database file not found]** If users don't rename their DB file, the app starts with an empty database → Add a startup log or clear error message if the old file exists but the new one doesn't.
- **[Missed references]** Some "rAIdical-em" references may be missed in the rename → Run a final grep after all changes to verify no occurrences remain.
