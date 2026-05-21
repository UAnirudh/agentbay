import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailLogs } from "@/lib/schema";
import { sendDailyRankingEmail } from "@/lib/email";
import { getQueuePosition } from "@/lib/referral";
import { anonymizeEmail } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "cron-secret-change-in-production";
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  if (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
    return new NextResponse(null, { status: 401 });
  }

  const allUsers = await db.select().from(users)
    .where(eq(users.isAdmin, false))
    .orderBy(desc(users.queueScore))
    .limit(500);

  const topUsers = allUsers.slice(0, 10).map((u, i) => ({
    name: u.name || anonymizeEmail(u.email),
    referralCount: u.referralCount,
    position: i + 1,
  }));

  let sent = 0;
  let failed = 0;

  for (const user of allUsers) {
    try {
      const position = await getQueuePosition(user.id);
      const success = await sendDailyRankingEmail(
        user.email, user.name || "", position, user.referralCount, user.referralCode, topUsers
      );
      if (success) {
        await db.insert(emailLogs).values({
          id: generateId(),
          userId: user.id,
          emailType: "daily_ranking",
          subject: `You're #${position} on AgentBay — daily update`,
        });
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`Failed to send daily email to ${user.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: allUsers.length });
}
