import { db } from "./db";
import { systemJobs, users, emailLogs, leaderboardSnapshots } from "./schema";
import { eq, desc } from "drizzle-orm";
import { sendDailyRankingEmail, sendWeeklySummaryEmail } from "./email";
import { getQueuePosition, getTotalSignups } from "./referral";
import { anonymizeEmail } from "./auth";
import { generateId } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const FIVE_MIN_MS = 5 * 60 * 1000;

interface JobDef {
  name: string;
  intervalMs: number;
  run: () => Promise<{ ok: boolean; info?: string }>;
}

const JOBS: JobDef[] = [
  { name: "daily_emails", intervalMs: DAY_MS, run: runDailyEmails },
  { name: "weekly_emails_and_snapshot", intervalMs: WEEK_MS, run: runWeeklyEmails },
];

let tickInFlight = false;

export async function tickDueJobs(): Promise<{ ran: string[] }> {
  if (tickInFlight) return { ran: [] };
  tickInFlight = true;
  const ran: string[] = [];
  try {
    for (const job of JOBS) {
      const state = (await db.select().from(systemJobs).where(eq(systemJobs.name, job.name)))[0];
      const lastRun = state?.lastRunAt ? new Date(state.lastRunAt).getTime() : 0;
      const now = Date.now();
      if (now - lastRun < job.intervalMs) continue;
      if (state?.lastRunAt && now - lastRun < FIVE_MIN_MS) continue;

      if (!state) {
        await db.insert(systemJobs).values({ name: job.name, lastRunAt: new Date(now), runCount: 0 });
      } else {
        await db.update(systemJobs).set({ lastRunAt: new Date(now) }).where(eq(systemJobs.name, job.name));
      }

      try {
        const result = await job.run();
        await db.update(systemJobs).set({
          lastSuccessAt: result.ok ? new Date() : state?.lastSuccessAt ?? null,
          lastError: result.ok ? null : result.info ?? "unknown",
          runCount: (state?.runCount ?? 0) + 1,
        }).where(eq(systemJobs.name, job.name));
        ran.push(`${job.name}:${result.ok ? "ok" : "fail"}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await db.update(systemJobs).set({
          lastError: msg,
          runCount: (state?.runCount ?? 0) + 1,
        }).where(eq(systemJobs.name, job.name));
        ran.push(`${job.name}:error`);
      }
    }
  } finally {
    tickInFlight = false;
  }
  return { ran };
}

export function tickInBackground() {
  tickDueJobs().catch((err) => console.error("[jobs] background tick failed:", err));
}

async function runDailyEmails(): Promise<{ ok: boolean; info?: string }> {
  const allUsers = await db.select().from(users)
    .where(eq(users.isAdmin, false))
    .orderBy(desc(users.queueScore))
    .limit(500);

  if (allUsers.length === 0) return { ok: true, info: "no users" };

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
    } catch {
      failed++;
    }
  }
  return { ok: failed === 0, info: `sent=${sent} failed=${failed}` };
}

async function runWeeklyEmails(): Promise<{ ok: boolean; info?: string }> {
  const allUsers = await db.select().from(users)
    .where(eq(users.isAdmin, false))
    .orderBy(desc(users.queueScore));
  const totalSignups = await getTotalSignups();

  if (allUsers.length > 0) {
    const snapshot = allUsers.slice(0, 100).map((u, i) => ({
      position: i + 1,
      name: u.name,
      referralCount: u.referralCount,
    }));
    await db.insert(leaderboardSnapshots).values({
      id: generateId(),
      snapshotData: JSON.stringify(snapshot),
    });
  }

  let sent = 0;
  let failed = 0;
  for (const user of allUsers) {
    try {
      const position = await getQueuePosition(user.id);
      const success = await sendWeeklySummaryEmail(
        user.email, user.name || "", position, user.referralCount, totalSignups, user.referralCode
      );
      if (success) {
        await db.insert(emailLogs).values({
          id: generateId(),
          userId: user.id,
          emailType: "weekly_summary",
          subject: `Weekly AgentBay update — you're #${position}`,
        });
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { ok: failed === 0, info: `sent=${sent} failed=${failed}` };
}
