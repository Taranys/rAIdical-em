CREATE TABLE `custom_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_categories_slug_unique` ON `custom_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_custom_categories_slug` ON `custom_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_custom_categories_sort_order` ON `custom_categories` (`sort_order`);