import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { count, gte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const [
    [{ totalUsers }],
    [{ usersToday }],
    [{ usersThisWeek }],
    [{ totalReferrals }],
    [{ referralsToday }],
    topReferrers,
    recentSignups,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ usersToday: count() }).from(users).where(gte(users.createdAt, new Date(oneDayAgo))),
    db.select({ usersThisWeek: count() }).from(users).where(gte(users.createdAt, new Date(sevenDaysAgo))),
    db.select({ totalReferrals: count() }).from(referralEvents),
    db.select({ referralsToday: count() }).from(referralEvents).where(gte(referralEvents.createdAt, new Date(oneDayAgo))),
    db.select({ id: users.id, email: users.email, name: users.name, referralCount: users.referralCount, isApproved: users.isApproved, createdAt: users.createdAt })
      .from(users).orderBy(desc(users.referralCount)).limit(10),
    db.select({ id: users.id, email: users.email, name: users.name, referralCount: users.referralCount, isApproved: users.isApproved, createdAt: users.createdAt })
      .from(users).orderBy(desc(users.createdAt)).limit(20),
  ]);

  const conversionRate = totalUsers > 0 ? ((totalReferrals / totalUsers) * 100).toFixed(1) : "0";

  return NextResponse.json({
    stats: {
      totalUsers,
      usersToday,
      usersThisWeek,
      totalReferrals,
      referralsToday,
      conversionRate,
      viralCoefficient: totalUsers > 0 ? (totalReferrals / totalUsers).toFixed(2) : "0",
    },
    topReferrers,
    recentSignups,
  });
}
