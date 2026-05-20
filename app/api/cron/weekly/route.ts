import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailLogs, leaderboardSnapshots } from "@/lib/schema";
import { sendWeeklySummaryEmail } from "@/lib/email";
import { getQueuePosition, getTotalSignups } from "@/lib/referral";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "cron-secret-change-in-production";
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  if (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
    return new NextResponse(null, { status: 401 });
  }

  const [allUsers, totalSignups] = await Promise.all([
    Promise.resolve(
      db.select().from(users)
        .where(eq(users.isAdmin, false))
        .orderBy(desc(users.queueScore))
        .all()
    ),
    getTotalSignups(),
  ]);

  const snapshot = allUsers.slice(0, 100).map((u, i) => ({
    position: i + 1,
    name: u.name,
    referralCount: u.referralCount,
  }));

  db.insert(leaderboardSnapshots).values({
    id: generateId(),
    snapshotData: JSON.stringify(snapshot),
  }).run();

  let sent = 0;
  let failed = 0;

  for (const user of allUsers) {
    try {
      const position = await getQueuePosition(user.id);
      const success = await sendWeeklySummaryEmail(
        user.email,
        user.name || "",
        position,
        user.referralCount,
        totalSignups,
        user.referralCode
      );

      if (success) {
        db.insert(emailLogs).values({
          id: generateId(),
          userId: user.id,
          emailType: "weekly_summary",
          subject: `Weekly AgentBay update — you're #${position}`,
        }).run();
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`Failed to send weekly email to ${user.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: allUsers.length, totalSignups });
}
