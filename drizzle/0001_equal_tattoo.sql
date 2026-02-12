PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pull_requests` (
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
	`ai_generated` text DEFAULT 'human' NOT NULL,
	`raw_json` text
);
--> statement-breakpoint
INSERT INTO `__new_pull_requests`("id", "github_id", "number", "title", "author", "state", "created_at", "merged_at", "additions", "deletions", "changed_files", "ai_generated", "raw_json") SELECT "id", "github_id", "number", "title", "author", "state", "created_at", "merged_at", "additions", "deletions", "changed_files", CASE WHEN "ai_generated" = 1 OR "ai_generated" = '1' THEN 'ai' ELSE 'human' END, "raw_json" FROM `pull_requests`;--> statement-breakpoint
DROP TABLE `pull_requests`;--> statement-breakpoint
ALTER TABLE `__new_pull_requests` RENAME TO `pull_requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `pull_requests_github_id_unique` ON `pull_requests` (`github_id`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_author` ON `pull_requests` (`author`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_state` ON `pull_requests` (`state`);--> statement-breakpoint
CREATE INDEX `idx_pull_requests_created_at` ON `pull_requests` (`created_at`);