# US-2.07: View Comment Classification Results

**Phase:** 2 — Review Quality Analysis
**Epic:** B — Comment Categorization
**Status:** Todo

## Story

As an engineering manager, I want to view the classification of each review comment so that I can understand the nature and depth of my team's reviews.

## Acceptance Criteria

- [ ] A new "Review Quality" page is accessible from the sidebar navigation
- [ ] Each classified comment displays: reviewer name, comment body (truncated with expand), category badge (color-coded), confidence score, PR title/link
- [ ] Comments can be filtered by: category, reviewer (team member), date range, confidence threshold
- [ ] Comments can be sorted by: date, confidence, category
- [ ] A summary bar at the top shows the category distribution as a horizontal stacked bar chart
- [ ] Unclassified comments are visually distinct (grayed out or labeled "Pending")
- [ ] Clicking a comment opens the full context: comment body, file path, PR link, classification reasoning

## Dependencies

- [US-2.05: Batch Classify Comments](US-2.05-batch-classify-comments.md) — classified data must exist
- [US-023: Application Shell](023-application-shell-navigation.md) — sidebar navigation
