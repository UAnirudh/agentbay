export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { count, gte, desc } from "drizzle-orm";
import { getTotalSignups } from "@/lib/referral";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.isAdmin) {
    notFound();
  }

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalUsers = await getTotalSignups();

  const [{ usersToday }] = db.select({ usersToday: count() }).from(users)
    .where(gte(users.createdAt, new Date(oneDayAgo))).all();

  const [{ usersThisWeek }] = db.select({ usersThisWeek: count() }).from(users)
    .where(gte(users.createdAt, new Date(sevenDaysAgo))).all();

  const [{ totalReferrals }] = db.select({ totalReferrals: count() }).from(referralEvents).all();

  const [{ referralsToday }] = db.select({ referralsToday: count() }).from(referralEvents)
    .where(gte(referralEvents.createdAt, new Date(oneDayAgo))).all();

  const topReferrers = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    referralCount: users.referralCount,
    isApproved: users.isApproved,
    createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.referralCount))
    .limit(10)
    .all();

  const recentSignups = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    referralCount: users.referralCount,
    isApproved: users.isApproved,
    createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.createdAt))
    .limit(20)
    .all();

  const conversionRate = totalUsers > 0 ? ((totalReferrals / totalUsers) * 100).toFixed(1) : "0";
  const viralCoefficient = totalUsers > 0 ? (totalReferrals / totalUsers).toFixed(2) : "0";

  const toIso = (v: Date | number | null) => {
    if (!v) return new Date().toISOString();
    return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
  };

  return (
    <AdminDashboard
      session={{ email: session.email, name: session.name }}
      stats={{ totalUsers, usersToday, usersThisWeek, totalReferrals, referralsToday, conversionRate, viralCoefficient }}
      topReferrers={topReferrers.map((u) => ({ ...u, createdAt: toIso(u.createdAt) }))}
      recentSignups={recentSignups.map((u) => ({ ...u, createdAt: toIso(u.createdAt) }))}
    />
  );
}
