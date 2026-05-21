import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQueuePosition, getTotalSignups } from "@/lib/referral";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getAppUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = (await db.select().from(users).where(eq(users.id, session.userId)))[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const recentReferrals = await db.select().from(referralEvents)
    .where(eq(referralEvents.referrerId, user.id))
    .orderBy(desc(referralEvents.createdAt))
    .limit(10);

  const [position, total] = await Promise.all([
    getQueuePosition(user.id),
    getTotalSignups(),
  ]);

  const appUrl = getAppUrl();
  const referralUrl = `${appUrl}/?ref=${user.referralCode}`;

  const milestones = [
    { label: "First referral", target: 1, icon: "🎯" },
    { label: "5 referrals", target: 5, icon: "🔥" },
    { label: "10 referrals", target: 10, icon: "💪" },
    { label: "25 referrals", target: 25, icon: "🚀" },
    { label: "50 referrals", target: 50, icon: "🌟" },
  ];

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      queueScore: user.queueScore,
      createdAt: user.createdAt,
    },
    position,
    total,
    referralUrl,
    milestones,
    recentReferrals: recentReferrals.map((r) => ({
      id: r.id,
      email: r.referreeEmail,
      createdAt: r.createdAt,
    })),
  });
}
