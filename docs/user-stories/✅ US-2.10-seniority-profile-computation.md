# US-2.10: Seniority Profile Computation

**Phase:** 2 — Review Quality Analysis
**Epic:** C — Seniority Signal Detection
**Status:** Done

## Story

As an engineering manager, I want the system to derive a multi-dimensional competency profile for each team member based on their review behavior so that I can understand their strengths and growth areas across technical domains and soft skills.

## Dependencies

- ✅ [US-2.09: Review Depth Score](✅%20US-2.09-review-depth-score.md) — depth score must be available
- ✅ [US-2.03: Phase 2 Database Schema](✅%20US-2.03-phase2-database-schema.md) — seniority_profiles table
- ✅ [US-2.02: LLM Abstraction Layer](✅%20US-2.02-llm-abstraction-layer.md) — LLM needed for soft skill inference

## Acceptance Criteria

- [x] A competency profile is computed per team member, grouped by **competency dimension** (not just programming language)
- [x] Competency dimensions are organized in two families:
  - **Technical domains**: programming languages (detected from `file_path`), security, infrastructure/ops, performance, testing, architecture/design
  - **Soft skills**: pedagogy (quality of explanations in comments), cross-team awareness (understanding global impacts and challenges of other teams), boldness (willingness to challenge code, even from senior authors), thoroughness (depth and consistency of reviews)
- [x] Technical domains are detected automatically from review comment context (file path, category, PR metadata)
- [x] Soft skills are inferred by the LLM during classification or via a dedicated prompt that evaluates a batch of a member's comments
- [x] The profile aggregates the following signals per dimension:
  - Review depth score (from US-2.09)
  - Volume of reviews (total comments in the period)
  - Ratio of high-value categories (bug, security, architecture) vs. low-value (nitpick, question)
  - Consistency: standard deviation of depth score across reviews (lower = more consistent)
- [x] A maturity level is derived per dimension: `junior`, `experienced`, `senior` — based on configurable thresholds on the aggregated signals (adapted from schema US-2.03)
- [x] Profiles are stored in the `seniority_profiles` table with the computed level, dimension, dimension family (technical/soft_skill), metrics JSON, and last-computed timestamp
- [x] Profiles are recomputed when new classifications are available (triggered after classification runs)
- [x] Unit tests verify level derivation with various input combinations

## Plan and implementation details

### Architecture

The implementation follows established patterns from `highlight-service.ts` and `classification-service.ts`:

1. **Configurable dimensions** (`src/lib/seniority-dimensions.ts`): Defines competency dimensions with name, family, and description. Technical category dimensions map classification categories to dimensions. Soft skill dimensions are defined with descriptions used in LLM prompts.

2. **Language detection** (`src/lib/language-detection.ts`): Pure function that maps file extensions to programming language names. Used to detect technical language dimensions from `review_comments.file_path`.

3. **Data Access Layer** (`src/db/seniority-profiles.ts`): CRUD operations for the `seniority_profiles` table — upsert, query by member, and delete all (for full recompute).

4. **New query** in `src/db/comment-classifications.ts`: `getClassifiedCommentsForProfile()` returns classified comments with file paths, categories, and bodies for both review_comments and pr_comments.

5. **Soft skill LLM assessor** (`src/lib/llm/soft-skill-assessor.ts`): Prompt builder + response parser following the `classifier.ts` pattern. Evaluates a batch of a member's comments against configurable soft skill definitions (name + description), returning a score 0-100 per skill.

6. **Main service** (`src/lib/seniority-profile-service.ts`): Orchestrates the full computation:
   - Fetches all classified comments and category distributions upfront
   - For each member: computes technical language dimensions (from file paths), technical category dimensions (from classification categories), and soft skills (via LLM)
   - Derives maturity level per dimension using configurable thresholds

7. **API route** (`POST /api/seniority-profiles/compute`): Fire-and-forget trigger, same pattern as `/api/highlights/generate`.

8. **Auto-trigger** in `src/lib/github-sync.ts`: Profiles are recomputed after each sync (fire-and-forget, after classification).

### Maturity level thresholds (adapted to schema's 3 levels)

- **Technical dimensions**: `senior` (depthScore ≥ 70, volume ≥ 10, highValueRatio ≥ 0.4), `experienced` (depthScore ≥ 40, volume ≥ 5), `junior` (everything else)
- **Soft skills**: `senior` (LLM score ≥ 70), `experienced` (score ≥ 40), `junior` (< 40)

### Files created/modified

- `src/lib/seniority-dimensions.ts` + `seniority-dimensions.test.ts`
- `src/lib/language-detection.ts` + `language-detection.test.ts`
- `src/db/seniority-profiles.ts`
- `src/db/comment-classifications.ts` (new query added)
- `src/lib/llm/soft-skill-assessor.ts` + `soft-skill-assessor.test.ts`
- `src/lib/llm/index.ts` (barrel export)
- `src/lib/seniority-profile-service.ts` + `seniority-profile-service.test.ts`
- `src/app/api/seniority-profiles/compute/route.ts`
- `src/lib/github-sync.ts` (auto-trigger after sync)
