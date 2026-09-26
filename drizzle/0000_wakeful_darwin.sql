CREATE TABLE `achievement` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`body_markdown` text,
	`cover_image_url` text,
	`occurred_at` text NOT NULL,
	`published_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_achievement_slug` ON `achievement` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_achievement_alive` ON `achievement` (`deleted_at`,"occurred_at" desc,`id`);--> statement-breakpoint
CREATE TABLE `achievement_revision` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`revision` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_revision_version_unique` ON `achievement_revision` (`achievement_id`,`revision`);--> statement-breakpoint
CREATE TABLE `achievement_tag` (
	`achievement_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`achievement_id`, `tag_id`),
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `achievement_tag_tag` ON `achievement_tag` (`tag_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `link` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`url` text NOT NULL,
	`label` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `link_achievement_position` ON `link` (`achievement_id`,`position`);--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalized` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_normalized_unique` ON `tag` (`normalized`);