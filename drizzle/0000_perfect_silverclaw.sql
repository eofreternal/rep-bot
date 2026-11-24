CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`creationDate` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages_in_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`lastBotMessage` integer,
	`botMessageId` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_in_channel_id_unique` ON `messages_in_channel` (`id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`rep` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);