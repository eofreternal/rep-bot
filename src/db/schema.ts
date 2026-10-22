import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
    id: text().unique().notNull().primaryKey(),
    points: int().notNull()
});

export const logsTable = sqliteTable("logs", {
    id: int().primaryKey({ autoIncrement: true }),
    channel: text().notNull(),

    creationDate: int().notNull()
})

export const messagesInChannelTable = sqliteTable("messages_in_channel", {
    id: text().unique().notNull().primaryKey(),
    number: int().notNull(),

    lastBotMessage: int(),

    lastBotReminderMessage: text(),
    lastBotReminderLeaderboardMessage: text(),
})