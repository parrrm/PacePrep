CREATE TABLE `learner_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`progress_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_learner_progress_updated_at` ON `learner_progress` (`updated_at`);