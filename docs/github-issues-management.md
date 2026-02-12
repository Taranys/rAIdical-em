# GitHub Issues Management

This document describes how GitHub issues are created and managed for the em-control-tower project.

## Labels

Every issue created from a user story uses the following label system:

### Primary Label

| Label | Color | Description |
|-------|-------|-------------|
| `user-story` | `#1D76DB` | Applied to all issues derived from user stories |

### Phase Labels

| Label | Color | Description |
|-------|-------|-------------|
| `phase:1` | `#0E8A16` | Phase 1 — GitHub Integration |
| `phase:2` | `#5319E7` | Phase 2 — Review Quality Analysis |

### Area Labels

| Label | Color | Description |
|-------|-------|-------------|
| `area:github-sync` | `#FBCA04` | GitHub data synchronization (fetch PRs, reviews, comments, sync status) |
| `area:dashboard` | `#F9D0C4` | Dashboard metrics and visualization (PR stats, period selector, charts) |
| `area:team-management` | `#C2E0C6` | Team member management (import, add, remove) |
| `area:llm-integration` | `#D4C5F9` | LLM provider integration (configuration, abstraction layer) |
| `area:comment-classification` | `#BFD4F2` | Review comment categorization (schema, prompts, batch/auto classification, results view) |
| `area:seniority-detection` | `#FEF2C0` | Seniority signal detection (depth score, profiles) |
| `area:one-on-one-prep` | `#E99695` | 1:1 preparation and highlights (best comments, growth opportunities, prep view) |
| `area:operations` | `#C5DEF5` | Operations and observability (classification history, manual reclassification) |

## Issue Format

Each issue follows this structure:

```markdown
## Story

As a [role], I want [feature] so that [benefit].

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- ...

## Dependencies

- US-XXX: Dependency title
```

- **Title**: matches the user story ID and title (e.g., `US-010: Fetch Pull Requests from GitHub`)
- **Labels**: `user-story` + `phase:N` + `area:xxx`
- **Body**: Story + Acceptance Criteria (as checkboxes) + Dependencies

## Issue Mapping

### Phase 1 — GitHub Integration

| US ID | Issue | Title | Area |
|-------|-------|-------|------|
| US-010 | [#24](https://github.com/Taranys/em-control-tower/issues/24) | Fetch Pull Requests from GitHub | `area:github-sync` |
| US-011 | [#25](https://github.com/Taranys/em-control-tower/issues/25) | Fetch PR Reviews from GitHub | `area:github-sync` |
| US-012 | [#26](https://github.com/Taranys/em-control-tower/issues/26) | Fetch PR Review Comments from GitHub | `area:github-sync` |
| US-013 | [#27](https://github.com/Taranys/em-control-tower/issues/27) | View Sync Status and History | `area:github-sync` |
| US-014 | [#28](https://github.com/Taranys/em-control-tower/issues/28) | Incremental Sync | `area:github-sync` |
| US-015 | [#29](https://github.com/Taranys/em-control-tower/issues/29) | View PRs Opened per Team Member | `area:dashboard` |
| US-016 | [#30](https://github.com/Taranys/em-control-tower/issues/30) | View PR Size per Team Member | `area:dashboard` |
| US-017 | [#31](https://github.com/Taranys/em-control-tower/issues/31) | View PRs Reviewed per Team Member | `area:dashboard` |
| US-018 | [#32](https://github.com/Taranys/em-control-tower/issues/32) | View Comments per Review per Team Member | `area:dashboard` |
| US-019 | [#33](https://github.com/Taranys/em-control-tower/issues/33) | Dashboard Period Selector | `area:dashboard` |
| US-021 | [#34](https://github.com/Taranys/em-control-tower/issues/34) | View AI vs. Human Authorship Ratio | `area:dashboard` |
| US-024 | [#35](https://github.com/Taranys/em-control-tower/issues/35) | Import Team Members from GitHub | `area:team-management` |

### Phase 2 — Review Quality Analysis

| US ID | Issue | Title | Area |
|-------|-------|-------|------|
| US-2.01 | [#36](https://github.com/Taranys/em-control-tower/issues/36) | Configure LLM Provider | `area:llm-integration` |
| US-2.02 | [#37](https://github.com/Taranys/em-control-tower/issues/37) | LLM Abstraction Layer | `area:llm-integration` |
| US-2.03 | [#38](https://github.com/Taranys/em-control-tower/issues/38) | Phase 2 Database Schema | `area:comment-classification` |
| US-2.04 | [#39](https://github.com/Taranys/em-control-tower/issues/39) | Classification Prompt Engineering | `area:comment-classification` |
| US-2.05 | [#40](https://github.com/Taranys/em-control-tower/issues/40) | Batch Classify Review Comments | `area:comment-classification` |
| US-2.06 | [#41](https://github.com/Taranys/em-control-tower/issues/41) | Auto-Classify New Comments on Sync | `area:comment-classification` |
| US-2.07 | [#42](https://github.com/Taranys/em-control-tower/issues/42) | View Comment Classification Results | `area:comment-classification` |
| US-2.08 | [#44](https://github.com/Taranys/em-control-tower/issues/44) | Category Distribution Dashboard | `area:comment-classification` |
| US-2.09 | [#43](https://github.com/Taranys/em-control-tower/issues/43) | Review Depth Score | `area:seniority-detection` |
| US-2.10 | [#45](https://github.com/Taranys/em-control-tower/issues/45) | Seniority Profile Computation | `area:seniority-detection` |
| US-2.11 | [#46](https://github.com/Taranys/em-control-tower/issues/46) | View Seniority Profiles | `area:seniority-detection` |
| US-2.12 | [#47](https://github.com/Taranys/em-control-tower/issues/47) | Detect Best Comments (Highlights) | `area:one-on-one-prep` |
| US-2.13 | [#48](https://github.com/Taranys/em-control-tower/issues/48) | Detect Growth Opportunities | `area:one-on-one-prep` |
| US-2.14 | [#49](https://github.com/Taranys/em-control-tower/issues/49) | 1:1 Preparation View | `area:one-on-one-prep` |
| US-2.15 | [#50](https://github.com/Taranys/em-control-tower/issues/50) | Classification Run History | `area:operations` |
| US-2.16 | [#51](https://github.com/Taranys/em-control-tower/issues/51) | Manually Reclassify a Comment | `area:operations` |

## How to Create a New Issue from a User Story

1. Write the user story in `docs/user-stories/` following the naming convention
2. Create the GitHub issue with `gh issue create`:

```bash
gh issue create \
  --repo Taranys/em-control-tower \
  --title "US-XXX: Title" \
  --label "user-story,phase:N,area:xxx" \
  --body "$(cat <<'EOF'
## Story

As a [role], I want [feature] so that [benefit].

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies

- US-YYY: Dependency title
EOF
)"
```

3. Update the mapping table in this document with the new issue number

## How to Create Labels

If setting up labels on a new repository, run:

```bash
gh label create "user-story" --color "1D76DB" --description "User story" --repo OWNER/REPO
gh label create "phase:1" --color "0E8A16" --description "Phase 1 — GitHub Integration" --repo OWNER/REPO
gh label create "phase:2" --color "5319E7" --description "Phase 2 — Review Quality Analysis" --repo OWNER/REPO
gh label create "area:github-sync" --color "FBCA04" --description "GitHub data synchronization" --repo OWNER/REPO
gh label create "area:dashboard" --color "F9D0C4" --description "Dashboard metrics and visualization" --repo OWNER/REPO
gh label create "area:team-management" --color "C2E0C6" --description "Team member management" --repo OWNER/REPO
gh label create "area:llm-integration" --color "D4C5F9" --description "LLM provider integration" --repo OWNER/REPO
gh label create "area:comment-classification" --color "BFD4F2" --description "Review comment categorization" --repo OWNER/REPO
gh label create "area:seniority-detection" --color "FEF2C0" --description "Seniority signal detection" --repo OWNER/REPO
gh label create "area:one-on-one-prep" --color "E99695" --description "1:1 preparation and highlights" --repo OWNER/REPO
gh label create "area:operations" --color "C5DEF5" --description "Operations and observability" --repo OWNER/REPO
```
