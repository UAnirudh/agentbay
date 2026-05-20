export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQueuePosition, getTotalSignups, getLeaderboard } from "@/lib/referral";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import WaitlistDashboard from "./WaitlistDashboard";

export default async function WaitlistPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user) redirect("/login");

  const recentReferrals = db.select().from(referralEvents)
    .where(eq(referralEvents.referrerId, user.id))
    .orderBy(desc(referralEvents.createdAt))
    .limit(5)
    .all();

  const [position, total, leaderboard] = await Promise.all([
    getQueuePosition(user.id),
    getTotalSignups(),
    getLeaderboard(10),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
        createdAt: user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
      }}
      position={position}
      total={total}
      referralUrl={referralUrl}
      leaderboard={leaderboardWithRanks.map((u) => ({
        ...u,
        createdAt: u.createdAt instanceof Date
          ? u.createdAt.toISOString()
          : new Date(u.createdAt as number).toISOString(),
      }))}
      recentReferrals={recentReferrals.map((r) => ({
        id: r.id,
        email: r.referreeEmail,
        createdAt: r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : new Date(r.createdAt as number).toISOString(),
      }))}
    />
  );
}
