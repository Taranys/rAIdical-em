CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`added_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_repositories_owner_name` ON `repositories` (`owner`,`name`);--> statement-breakpoint
ALTER TABLE `pr_comments` ADD `repository_id` integer REFERENCES repositories(id);--> statement-breakpoint
CREATE INDEX `idx_pr_comments_repository_id` ON `pr_comments` (`repository_id`);--> statement-breakpoint
ALTER TABLE `pull_requests` ADD `repository_id` integer REFERENCES repositories(id);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_repository_id` ON `pull_requests` (`repository_id`);--> statement-breakpoint
ALTER TABLE `review_comments` ADD `repository_id` integer REFERENCES repositories(id);--> statement-breakpoint
CREATE INDEX `idx_review_comments_repository_id` ON `review_comments` (`repository_id`);--> statement-breakpoint
ALTER TABLE `reviews` ADD `repository_id` integer REFERENCES repositories(id);--> statement-breakpoint
CREATE INDEX `idx_reviews_repository_id` ON `reviews` (`repository_id`);--> statement-breakpoint
ALTER TABLE `sync_runs` ADD `repository_id` integer REFERENCES repositories(id);--> statement-breakpoint
CREATE INDEX `idx_sync_runs_repository_id` ON `sync_runs` (`repository_id`);