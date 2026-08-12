CREATE TABLE `article_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`locale` varchar(10) NOT NULL,
	`title` text NOT NULL,
	`slug` varchar(500) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`audioUrl` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`translatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `article_translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topicSlug` varchar(120) NOT NULL,
	`topicLabel` varchar(255) NOT NULL,
	`alertEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_topics_user_topic_unique` UNIQUE(`userId`,`topicSlug`)
);
--> statement-breakpoint
ALTER TABLE `pro_memberships` MODIFY COLUMN `plan` enum('monthly','annual','crew_monthly','captain_monthly','firstclass_monthly','crew_annual','captain_annual','firstclass_annual') NOT NULL DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `articles` ADD `audioUrl` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `articleQaScore` float;--> statement-breakpoint
ALTER TABLE `articles` ADD `imageQaScore` float;--> statement-breakpoint
ALTER TABLE `articles` ADD `articleQaPasses` int;--> statement-breakpoint
ALTER TABLE `articles` ADD `imageQaPasses` int;--> statement-breakpoint
ALTER TABLE `articles` ADD `imageAttribution` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `imageAttributionUrl` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `imageRequiresAttribution` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `articles` ADD `status` enum('draft','published','rejected') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `pro_memberships` ADD `tier` enum('crew','captain','firstclass') DEFAULT 'firstclass' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `postCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `reputationScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `reputationRank` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;