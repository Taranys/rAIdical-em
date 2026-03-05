CREATE TABLE `seniority_dimension_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`family` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`source_categories` text,
	`is_enabled` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seniority_dimension_configs_name_unique` ON `seniority_dimension_configs` (`name`);--> statement-breakpoint
CREATE INDEX `idx_seniority_dimension_configs_family` ON `seniority_dimension_configs` (`family`);--> statement-breakpoint
CREATE INDEX `idx_seniority_dimension_configs_enabled` ON `seniority_dimension_configs` (`is_enabled`);--> statement-breakpoint
INSERT INTO `seniority_dimension_configs` (`name`, `family`, `label`, `description`, `source_categories`, `is_enabled`, `sort_order`, `created_at`, `updated_at`) VALUES
('security', 'technical', 'Security', 'Ability to detect security vulnerabilities, injection risks, and unsafe practices in code reviews', '["security"]', 1, 0, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('architecture', 'technical', 'Architecture', 'Understanding of design patterns, system structure, API contracts, and architectural trade-offs', '["architecture_design"]', 1, 1, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('performance', 'technical', 'Performance', 'Ability to spot performance bottlenecks, inefficient algorithms, and optimization opportunities', '["performance"]', 1, 2, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('testing', 'technical', 'Testing', 'Focus on test coverage, edge cases, test quality, and testing best practices', '["missing_test_coverage"]', 1, 3, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('pedagogy', 'soft_skill', 'Pedagogy', 'Quality of explanations in review comments — does the reviewer teach and explain the ''why'', not just point out issues?', NULL, 1, 4, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('cross_team_awareness', 'soft_skill', 'Cross-team Awareness', 'Understanding of global impacts and challenges beyond the reviewer''s own team — awareness of cross-cutting concerns and other teams'' constraints', NULL, 1, 5, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('boldness', 'soft_skill', 'Boldness', 'Willingness to challenge code and push back on decisions, even from senior or experienced authors — constructive courage in reviews', NULL, 1, 6, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
('thoroughness', 'soft_skill', 'Thoroughness', 'Depth and consistency of reviews — does the reviewer systematically check edge cases, error handling, and completeness?', NULL, 1, 7, '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z');