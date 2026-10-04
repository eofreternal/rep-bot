import { drizzle } from 'drizzle-orm/libsql';

const db = drizzle("database.sqlite");
export { db }