// US-022: Phase 1 database schema
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
    commentCount: integer("comment_count").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_sync_runs_repository").on(table.repository),
    index("idx_sync_runs_status").on(table.status),
  ]
);
