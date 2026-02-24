// US-022: Phase 1 database schema / US-2.03: Phase 2 schema extension
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Key/value store for app settings (PAT, org, repo, etc.)
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Team members managed manually by the EM
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubUsername: text("github_username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  color: text("color").notNull().default("#E25A3B"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Pull requests synced from GitHub
export const pullRequests = sqliteTable(
  "pull_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubId: integer("github_id").notNull().unique(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    state: text("state").notNull(), // open | closed | merged
    createdAt: text("created_at").notNull(),
    mergedAt: text("merged_at"),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    changedFiles: integer("changed_files").notNull().default(0),
    aiGenerated: text("ai_generated").notNull().default("human"), // US-020: ai | human | mixed
    rawJson: text("raw_json"),
  },
  (table) => [
    index("idx_pull_requests_author").on(table.author),
    index("idx_pull_requests_state").on(table.state),
    index("idx_pull_requests_created_at").on(table.createdAt),
  ]
);

// PR reviews (APPROVED, CHANGES_REQUESTED, COMMENTED)
export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubId: integer("github_id").notNull().unique(),
    pullRequestId: integer("pull_request_id")
      .notNull()
      .references(() => pullRequests.id),
    reviewer: text("reviewer").notNull(),
    state: text("state").notNull(), // APPROVED | CHANGES_REQUESTED | COMMENTED
    submittedAt: text("submitted_at").notNull(),
  },
  (table) => [
    index("idx_reviews_reviewer").on(table.reviewer),
    index("idx_reviews_pull_request_id").on(table.pullRequestId),
  ]
);

// Inline code review comments (on specific file/line)
export const reviewComments = sqliteTable(
  "review_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubId: integer("github_id").notNull().unique(),
    pullRequestId: integer("pull_request_id")
      .notNull()
      .references(() => pullRequests.id),
    reviewer: text("reviewer").notNull(),
    body: text("body").notNull(),
    filePath: text("file_path"),
    line: integer("line"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_review_comments_reviewer").on(table.reviewer),
    index("idx_review_comments_pull_request_id").on(table.pullRequestId),
  ]
);

// General PR comments (issue-style, not inline on code)
export const prComments = sqliteTable(
  "pr_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    githubId: integer("github_id").notNull().unique(),
    pullRequestId: integer("pull_request_id")
      .notNull()
      .references(() => pullRequests.id),
    author: text("author").notNull(),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_pr_comments_author").on(table.author),
    index("idx_pr_comments_pull_request_id").on(table.pullRequestId),
  ]
);

// Sync run history — one entry per repository per sync
export const syncRuns = sqliteTable(
  "sync_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    repository: text("repository").notNull(), // "owner/repo"
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    status: text("status").notNull(), // running | success | error
    prCount: integer("pr_count").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_sync_runs_repository").on(table.repository),
    index("idx_sync_runs_status").on(table.status),
  ]
);

// --- Phase 2: Review Quality Analysis ---

// US-2.03: Batch classification job tracking
export const classificationRuns = sqliteTable(
  "classification_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    status: text("status").notNull(), // pending | running | success | error
    commentsProcessed: integer("comments_processed").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    modelUsed: text("model_used").notNull(),
  },
  (table) => [
    index("idx_classification_runs_status").on(table.status),
  ]
);

// US-2.03: Comment → category classification (polymorphic: review_comment | pr_comment)
export const commentClassifications = sqliteTable(
  "comment_classifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commentType: text("comment_type").notNull(), // 'review_comment' | 'pr_comment'
    commentId: integer("comment_id").notNull(),
    category: text("category").notNull(),
    confidence: integer("confidence").notNull(), // 0-100
    modelUsed: text("model_used").notNull(),
    classificationRunId: integer("classification_run_id")
      .references(() => classificationRuns.id),
    classifiedAt: text("classified_at").notNull(),
    reasoning: text("reasoning"), // US-2.07: LLM classification reasoning (nullable for old rows)
    isManual: integer("is_manual").notNull().default(0), // US-2.16: 0 = LLM, 1 = manual override
  },
  (table) => [
    index("idx_comment_classifications_comment").on(table.commentType, table.commentId),
    index("idx_comment_classifications_category").on(table.category),
    index("idx_comment_classifications_run_id").on(table.classificationRunId),
  ]
);

// US-2.03: Per-member seniority profile by competency dimension
export const seniorityProfiles = sqliteTable(
  "seniority_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamMemberId: integer("team_member_id")
      .notNull()
      .references(() => teamMembers.id),
    dimensionName: text("dimension_name").notNull(),
    dimensionFamily: text("dimension_family").notNull(), // 'technical' | 'soft_skill'
    maturityLevel: text("maturity_level").notNull(), // 'junior' | 'experienced' | 'senior'
    lastComputedAt: text("last_computed_at").notNull(),
    supportingMetrics: text("supporting_metrics"), // JSON string
  },
  (table) => [
    index("idx_seniority_profiles_team_member").on(table.teamMemberId),
    index("idx_seniority_profiles_dimension").on(table.dimensionFamily, table.dimensionName),
  ]
);

// US-2.03: Flagged comments for 1:1 prep (polymorphic comment reference)
export const highlights = sqliteTable(
  "highlights",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commentType: text("comment_type").notNull(), // 'review_comment' | 'pr_comment'
    commentId: integer("comment_id").notNull(),
    highlightType: text("highlight_type").notNull(), // 'best_comment' | 'growth_opportunity'
    reasoning: text("reasoning").notNull(),
    teamMemberId: integer("team_member_id")
      .notNull()
      .references(() => teamMembers.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_highlights_team_member").on(table.teamMemberId),
    index("idx_highlights_type").on(table.highlightType),
    index("idx_highlights_comment").on(table.commentType, table.commentId),
  ]
);
