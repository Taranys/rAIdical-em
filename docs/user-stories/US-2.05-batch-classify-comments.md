# US-2.05: Batch Classify Review Comments

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As an engineering manager, I want to classify all unclassified review comments in batch so that historical data is categorized without manual effort.

## Acceptance Criteria

- [ ] A "Classify Comments" action is available on the review quality page
- [ ] The batch process finds all review comments and PR comments that have no classification yet
- [ ] Comments are sent to the LLM in batches (configurable batch size, default: 10 comments per request) to optimize API usage
- [ ] A `classification_runs` entry is created to track progress (started, in progress, completed, error)
- [ ] Real-time progress is displayed: comments classified / total, current batch, errors encountered
- [ ] Each classified comment is stored in `comment_classifications` with category, confidence, reasoning, and model used
- [ ] The process is interruptible — partial progress is saved and can be resumed
- [ ] Rate limit errors from the LLM trigger automatic backoff and retry (via US-2.02)
- [ ] A summary is shown on completion: total classified, breakdown by category, average confidence, errors

## Dependencies

- [US-2.03: Phase 2 Database Schema](US-2.03-phase2-database-schema.md) — classification tables must exist
- [US-2.04: Classification Prompt Engineering](US-2.04-classification-prompt-engineering.md) — prompt template must be ready
- [US-012: Fetch PR Review Comments](012-fetch-pr-review-comments.md) — review comments must be synced from GitHub
