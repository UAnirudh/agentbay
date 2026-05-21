import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

function resolveDbPath(): string {
  const envPath = process.env.DATABASE_PATH || process.env.SQLITE_PATH;
  if (envPath) {
    const dir = path.dirname(envPath);
    try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    return envPath;
  }
  // Auto-detect Railway: RAILWAY_ENVIRONMENT is always set in Railway containers.
  // Use the persistent volume mount at /data so the DB survives redeployments.
  if (process.env.RAILWAY_ENVIRONMENT) {
    try { fs.mkdirSync("/data", { recursive: true }); } catch { /* ignore */ }
    return "/data/agentbay.db";
  }
  return path.resolve(process.cwd(), "prisma", "dev.db");
}

const DB_PATH = resolveDbPath();

const globalForDb = globalThis as unknown as { sqlite: Database.Database };

const sqlite = globalForDb.sqlite || new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");
globalForDb.sqlite = sqlite;

if (process.env.NODE_ENV !== "production") {
  console.log(`[db] SQLite at ${DB_PATH}`);
}

export const db = drizzle(sqlite, { schema });
export default db;
