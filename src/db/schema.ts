import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
    id: text().unique().notNull().primaryKey(),
    rep: int().notNull()
});

export const logsTable = sqliteTable("logs", {
    id: int().primaryKey({ autoIncrement: true }),
    channel: text().notNull(),

    creationDate: int().notNull()
})

export const messagesInChannelTable = sqliteTable("messages_in_channel", {
    id: text().unique().notNull().primaryKey(),
    number: int().notNull(),

    firstMessageTimestamp: int().notNull(),
    botMessageId: text(),
})