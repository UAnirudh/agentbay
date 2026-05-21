import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  googleId: text("google_id").unique(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(false),
  waitlistPosition: integer("waitlist_position"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
  queueScore: real("queue_score").notNull().default(0),
  lastLogin: integer("last_login", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const referralEvents = sqliteTable("referral_events", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  referreeEmail: text("referree_email").notNull(),
  referreeId: text("referree_id"),
  ipAddress: text("ip_address"),
  isFraud: integer("is_fraud", { mode: "boolean" }).notNull().default(false),
  convertedAt: integer("converted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const emailLogs = sqliteTable("email_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  emailType: text("email_type").notNull(),
  subject: text("subject").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
  opened: integer("opened", { mode: "boolean" }).notNull().default(false),
  clicked: integer("clicked", { mode: "boolean" }).notNull().default(false),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  value: text("value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const leaderboardSnapshots = sqliteTable("leaderboard_snapshots", {
  id: text("id").primaryKey(),
  snapshotDate: integer("snapshot_date", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
  snapshotData: text("snapshot_data").notNull(),
});

export const systemJobs = sqliteTable("system_jobs", {
  name: text("name").primaryKey(),
  lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
  lastSuccessAt: integer("last_success_at", { mode: "timestamp_ms" }),
  lastError: text("last_error"),
  runCount: integer("run_count").notNull().default(0),
});

export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(1),
  resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull().default("used"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("agentbay"),
  externalUrl: text("external_url"),
  externalSource: text("external_source"),
  views: integer("views").notNull().default(0),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  tags: text("tags"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const agentSessions = sqliteTable("agent_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  mode: text("mode").notNull(),
  query: text("query").notNull(),
  status: text("status").notNull().default("active"),
  resultData: text("result_data"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const agentMessages = sqliteTable("agent_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => agentSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export const negotiations = sqliteTable("negotiations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  buyerId: text("buyer_id").notNull().references(() => users.id),
  sellerId: text("seller_id").notNull().references(() => users.id),
  initialPriceCents: integer("initial_price_cents").notNull(),
  currentOfferCents: integer("current_offer_cents").notNull(),
  finalPriceCents: integer("final_price_cents"),
  status: text("status").notNull().default("active"),
  lastTurn: text("last_turn").notNull().default("buyer"),
  history: text("history").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type AgentSession = typeof agentSessions.$inferSelect;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type Negotiation = typeof negotiations.$inferSelect;
