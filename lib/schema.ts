import { pgTable, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  googleId: text("google_id").unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  waitlistPosition: integer("waitlist_position"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
  queueScore: real("queue_score").notNull().default(0),
  lastLogin: timestamp("last_login"),
  preferences: text("preferences"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const referralEvents = pgTable("referral_events", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  referreeEmail: text("referree_email").notNull(),
  referreeId: text("referree_id"),
  ipAddress: text("ip_address"),
  isFraud: boolean("is_fraud").notNull().default(false),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  emailType: text("email_type").notNull(),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  opened: boolean("opened").notNull().default(false),
  clicked: boolean("clicked").notNull().default(false),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  value: text("value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leaderboardSnapshots = pgTable("leaderboard_snapshots", {
  id: text("id").primaryKey(),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
  snapshotData: text("snapshot_data").notNull(),
});

export const systemJobs = pgTable("system_jobs", {
  name: text("name").primaryKey(),
  lastRunAt: timestamp("last_run_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastError: text("last_error"),
  runCount: integer("run_count").notNull().default(0),
});

export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(1),
  resetAt: timestamp("reset_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const listings = pgTable("listings", {
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
  aiGenerated: boolean("ai_generated").notNull().default(false),
  tags: text("tags"),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentSessions = pgTable("agent_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  mode: text("mode").notNull(),
  query: text("query").notNull(),
  status: text("status").notNull().default("active"),
  resultData: text("result_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentMessages = pgTable("agent_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => agentSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const negotiations = pgTable("negotiations", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
