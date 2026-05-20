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

export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(1),
  resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch('now') * 1000)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
