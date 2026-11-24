ALTER TABLE `users` RENAME COLUMN "rep" TO "points";--> statement-breakpoint
ALTER TABLE `messages_in_channel` ADD `lastBotReminderMessage` text;--> statement-breakpoint
ALTER TABLE `messages_in_channel` ADD `lastBotReminderLeaderboardMessage` text;--> statement-breakpoint
ALTER TABLE `messages_in_channel` DROP COLUMN `botMessageId`;