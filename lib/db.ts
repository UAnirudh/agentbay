import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "prisma", "dev.db");

const globalForDb = globalThis as unknown as { sqlite: Database.Database };

const sqlite = globalForDb.sqlite || new Database(DB_PATH);

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });
export default db;
