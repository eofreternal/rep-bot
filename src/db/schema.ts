import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
    id: text().unique().notNull().primaryKey(),
    rep: int().notNull()
});