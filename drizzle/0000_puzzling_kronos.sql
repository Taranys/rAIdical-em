CREATE TABLE `pr_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`pull_request_id` integer NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pull_request_id`) REFERENCES `pull_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pr_comments_github_id_unique` ON `pr_comments` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_comments_author` ON `pr_comments` (`author`);--> statement-breakpoint
CREATE INDEX `idx_pr_comments_pull_request_id` ON `pr_comments` (`pull_request_id`);--> statement-breakpoint
CREATE TABLE `pull_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`state` text NOT NULL,
	`created_at` text NOT NULL,
	`merged_at` text,
	`additions` integer DEFAULT 0 NOT NULL,
	`deletions` integer DEFAULT 0 NOT NULL,
	`changed_files` integer DEFAULT 0 NOT NULL,
	`ai_generated` integer DEFAULT 0 NOT NULL,
	`raw_json` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pull_requests_github_id_unique` ON `pull_requests` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_author` ON `pull_requests` (`author`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_state` ON `pull_requests` (`state`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_created_at` ON `pull_requests` (`created_at`);--> statement-breakpoint
CREATE TABLE `review_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`pull_request_id` integer NOT NULL,
	`reviewer` text NOT NULL,
	`body` text NOT NULL,
	`file_path` text,
	`line` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pull_request_id`) REFERENCES `pull_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_comments_github_id_unique` ON `review_comments` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_review_comments_reviewer` ON `review_comments` (`reviewer`);--> statement-breakpoint
CREATE INDEX `idx_review_comments_pull_request_id` ON `review_comments` (`pull_request_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_id` integer NOT NULL,
	`pull_request_id` integer NOT NULL,
	`reviewer` text NOT NULL,
	`state` text NOT NULL,
	`submitted_at` text NOT NULL,
	FOREIGN KEY (`pull_request_id`) REFERENCES `pull_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_github_id_unique` ON `reviews` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewer` ON `reviews` (`reviewer`);--> statement-breakpoint
CREATE INDEX `idx_reviews_pull_request_id` ON `reviews` (`pull_request_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text NOT NULL,
	`pr_count` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `idx_sync_runs_repository` ON `sync_runs` (`repository`);--> statement-breakpoint
CREATE INDEX `idx_sync_runs_status` ON `sync_runs` (`status`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`github_username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_github_username_unique` ON `team_members` (`github_username`);