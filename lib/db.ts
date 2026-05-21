import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV === "production") {
  console.error("[db] FATAL: DATABASE_URL is not set. Check your Railway environment variables.");
}

// Railway internal URLs (.railway.internal) don't need SSL.
// Public URLs (monorail.proxy.rlwy.net, etc.) do.
// Local dev never needs SSL.
function needsSsl(url: string): boolean {
  if (!url) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  if (url.includes(".railway.internal")) return false;
  return true;
}

const client =
  globalThis._pgClient ??
  postgres(dbUrl || "postgresql://localhost/placeholder", {
    max: 10,
    ssl: dbUrl && needsSsl(dbUrl) ? { rejectUnauthorized: false } : false,
    connect_timeout: 15,
    idle_timeout: 20,
    max_lifetime: 1800,
    onnotice: () => {},
  });

// Always cache — prevents multiple pools across hot-reloads and module re-evals
globalThis._pgClient = client;

export const db = drizzle(client, { schema });
export default db;
