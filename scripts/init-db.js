const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "..", "prisma", "dev.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  google_id TEXT UNIQUE,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 0,
  waitlist_position INTEGER,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  referral_count INTEGER NOT NULL DEFAULT 0,
  queue_score REAL NOT NULL DEFAULT 0,
  last_login INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS referral_events (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id),
  referree_email TEXT NOT NULL,
  referree_id TEXT,
  ip_address TEXT,
  is_fraud INTEGER NOT NULL DEFAULT 0,
  converted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  opened INTEGER NOT NULL DEFAULT 0,
  clicked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_date INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  snapshot_data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_queue_score ON users(queue_score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
`);

console.log("✅ Database initialized at", dbPath);
db.close();
