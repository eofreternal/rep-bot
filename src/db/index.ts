import { drizzle } from 'drizzle-orm/libsql';

const db = drizzle("file:../database.sqlite");
export { db }