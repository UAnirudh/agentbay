const postgres = require("postgres");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set — skipping DB init");
  process.exit(0);
}

function needsSsl(url) {
  if (!url) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  if (url.includes(".railway.internal")) return false;
  return true;
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  ssl: needsSsl(DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

async function init() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      image TEXT,
      google_id TEXT UNIQUE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      waitlist_position INTEGER,
      referral_code TEXT NOT NULL UNIQUE,
      referred_by TEXT,
      referral_count INTEGER NOT NULL DEFAULT 0,
      queue_score REAL NOT NULL DEFAULT 0,
      last_login TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referral_events (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL REFERENCES users(id),
      referree_email TEXT NOT NULL,
      referree_id TEXT,
      ip_address TEXT,
      is_fraud BOOLEAN NOT NULL DEFAULT FALSE,
      converted_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      email_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      opened BOOLEAN NOT NULL DEFAULT FALSE,
      clicked BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date TIMESTAMP NOT NULL DEFAULT NOW(),
      snapshot_data TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS system_jobs (
      name TEXT PRIMARY KEY,
      last_run_at TIMESTAMP,
      last_success_at TIMESTAMP,
      last_error TEXT,
      run_count INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      count INTEGER NOT NULL DEFAULT 1,
      reset_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'used',
      price_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      source TEXT NOT NULL DEFAULT 'agentbay',
      external_url TEXT,
      external_source TEXT,
      views INTEGER NOT NULL DEFAULT 0,
      ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
      tags TEXT,
      location TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      mode TEXT NOT NULL,
      query TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      result_data TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agent_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES agent_sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id),
      buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES users(id),
      initial_price_cents INTEGER NOT NULL,
      current_offer_cents INTEGER NOT NULL,
      final_price_cents INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      last_turn TEXT NOT NULL DEFAULT 'buyer',
      history TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON agent_messages(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_negotiations_buyer ON negotiations(buyer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_negotiations_listing ON negotiations(listing_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_queue_score ON users(queue_score DESC, created_at ASC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id)`;

  await sql.end();
  console.log("✅ Database initialized");
}

init().catch((err) => {
  console.error("❌ Database init failed:", err.message);
  process.exit(0);
});
