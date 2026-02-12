# Plan 001 — Phase 1: GitHub Integration — PR Metrics & Review Comment Extraction

**Status:** Draft
**Phase:** 1
**Date:** 2026-02-12

---

## Overview

Phase 1 connects em-control-tower to a single GitHub organization/repository and builds the data foundation for all downstream features. It covers:

- GitHub PAT configuration via a settings UI
- Team member management (manual)
- PR and review data ingestion from GitHub
- Delivery metrics dashboard
- AI vs. human authorship heuristic definition

---

## User Stories

### Epic A — GitHub Configuration

- [US-005: Configure GitHub Personal Access Token](../user-stories/005-configure-github-pat.md)
- [US-006: Configure Target GitHub Repository](../user-stories/006-configure-target-repository.md)

### Epic B — Team Member Management

- [US-007: Add a Team Member](../user-stories/007-add-team-member.md)
- [US-008: Remove a Team Member](../user-stories/008-remove-team-member.md)
- [US-009: View Team Member List](../user-stories/009-view-team-member-list.md)

### Epic C — GitHub Data Sync

- [US-010: Fetch Pull Requests from GitHub](../user-stories/010-fetch-pull-requests.md)
- [US-011: Fetch PR Reviews from GitHub](../user-stories/011-fetch-pr-reviews.md)
- [US-012: Fetch PR Review Comments from GitHub](../user-stories/012-fetch-pr-review-comments.md)
- [US-013: View Sync Status and History](../user-stories/013-view-sync-status.md)
- [US-014: Incremental Sync](../user-stories/014-incremental-sync.md)

### Epic D — Delivery Metrics Dashboard

- [US-015: View PRs Opened per Team Member](../user-stories/015-view-prs-opened.md)
- [US-016: View PR Size per Team Member](../user-stories/016-view-pr-size.md)
- [US-017: View PRs Reviewed per Team Member](../user-stories/017-view-prs-reviewed.md)
- [US-018: View Comments per Review per Team Member](../user-stories/018-view-comments-per-review.md)
- [US-019: Dashboard Period Selector](../user-stories/019-dashboard-period-selector.md)

### Epic E — AI vs. Human Authorship

- [US-020: Define AI Authorship Heuristic](../user-stories/020-define-ai-authorship-heuristic.md)
- [US-021: View AI vs. Human Authorship Ratio](../user-stories/021-view-ai-vs-human-ratio.md)

### Epic F — Database Schema

- [US-022: Design and Implement Phase 1 Database Schema](../user-stories/022-database-schema-phase1.md)

### Epic G — Navigation & Layout

- [US-023: Application Shell and Navigation](../user-stories/023-application-shell-navigation.md)

---

## Story dependency graph

```
US-022 (Schema)
  └─→ US-005 (PAT config)
        └─→ US-006 (Repo config)
              └─→ US-007 (Add member)
                    ├─→ US-008 (Remove member)
                    ├─→ US-009 (View members)
                    └─→ US-010 (Fetch PRs)
                          ├─→ US-011 (Fetch reviews)
                          │     └─→ US-012 (Fetch comments)
                          ├─→ US-013 (Sync status)
                          └─→ US-014 (Incremental sync)

US-019 (Period selector)
  ├─→ US-015 (PRs opened)
  ├─→ US-016 (PR size)
  ├─→ US-017 (PRs reviewed)
  ├─→ US-018 (Comments per review)
  └─→ US-021 (AI vs. human ratio)

US-020 (AI heuristic config) ─→ US-021 (AI vs. human ratio)

US-023 (App shell) — independent, can be built in parallel
```

---

## Out of scope for Phase 1

- Comment categorization (Phase 2)
- Seniority profiling (Phase 2)
- Highlight reel / 1:1 prep view (Phase 3)
- Slack, Confluence, Jira integration (Phase 4)
- OKR-to-goals engine (Phase 5)
- Multi-repo / multi-org support
- Automatic scheduled sync (manual trigger only)
- User authentication / multi-user access (single-user local app)
