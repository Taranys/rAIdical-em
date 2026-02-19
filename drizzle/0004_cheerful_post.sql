CREATE TABLE `classification_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text NOT NULL,
	`comments_processed` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`model_used` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_classification_runs_status` ON `classification_runs` (`status`);--> statement-breakpoint
CREATE TABLE `comment_classifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_type` text NOT NULL,
	`comment_id` integer NOT NULL,
	`category` text NOT NULL,
	`confidence` integer NOT NULL,
	`model_used` text NOT NULL,
	`classification_run_id` integer,
	`classified_at` text NOT NULL,
	FOREIGN KEY (`classification_run_id`) REFERENCES `classification_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comment_classifications_comment` ON `comment_classifications` (`comment_type`,`comment_id`);--> statement-breakpoint
CREATE INDEX `idx_comment_classifications_category` ON `comment_classifications` (`category`);--> statement-breakpoint
CREATE INDEX `idx_comment_classifications_run_id` ON `comment_classifications` (`classification_run_id`);--> statement-breakpoint
CREATE TABLE `highlights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_type` text NOT NULL,
	`comment_id` integer NOT NULL,
	`highlight_type` text NOT NULL,
	`reasoning` text NOT NULL,
	`team_member_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_highlights_team_member` ON `highlights` (`team_member_id`);--> statement-breakpoint
CREATE INDEX `idx_highlights_type` ON `highlights` (`highlight_type`);--> statement-breakpoint
CREATE INDEX `idx_highlights_comment` ON `highlights` (`comment_type`,`comment_id`);--> statement-breakpoint
CREATE TABLE `seniority_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_member_id` integer NOT NULL,
	`dimension_name` text NOT NULL,
	`dimension_family` text NOT NULL,
	`maturity_level` text NOT NULL,
	`last_computed_at` text NOT NULL,
	`supporting_metrics` text,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_seniority_profiles_team_member` ON `seniority_profiles` (`team_member_id`);--> statement-breakpoint
CREATE INDEX `idx_seniority_profiles_dimension` ON `seniority_profiles` (`dimension_family`,`dimension_name`);