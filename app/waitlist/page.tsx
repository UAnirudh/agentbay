export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQueuePosition, getTotalSignups, getLeaderboard } from "@/lib/referral";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getAppUrl } from "@/lib/utils";
import WaitlistDashboard from "./WaitlistDashboard";

export default async function WaitlistPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = (await db.select().from(users).where(eq(users.id, session.userId)))[0];
  if (!user) redirect("/login");

  const recentReferrals = await db.select().from(referralEvents)
    .where(eq(referralEvents.referrerId, user.id))
    .orderBy(desc(referralEvents.createdAt))
    .limit(5);

  const [position, total, leaderboard] = await Promise.all([
    getQueuePosition(user.id),
    getTotalSignups(),
    getLeaderboard(10),
  ]);

  const appUrl = getAppUrl();
  const referralUrl = `${appUrl}/?ref=${user.referralCode}`;

  const leaderboardWithRanks = leaderboard.map((u, i) => ({
    ...u,
    position: i + 1,
    isCurrentUser: u.id === user.id,
  }));

  return (
    <WaitlistDashboard
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      }}
      position={position}
      total={total}
      referralUrl={referralUrl}
      leaderboard={leaderboardWithRanks.map((u) => ({
        ...u,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      }))}
      recentReferrals={recentReferrals.map((r) => ({
        id: r.id,
        email: r.referreeEmail,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      }))}
    />
  );
}
