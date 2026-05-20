import { db } from "./db";
import { users, referralEvents } from "./schema";
import { eq, gt, or, and, desc, asc, count, sql } from "drizzle-orm";
import { generateId } from "./utils";

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateUniqueReferralCode(): Promise<string> {
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = db.select().from(users).where(eq(users.referralCode, code)).get();
    if (!existing) return code;
    code = generateReferralCode();
    attempts++;
  }
  return `${generateReferralCode()}${Date.now().toString(36).toUpperCase()}`;
}

export async function creditReferral(referralCode: string, referreeEmail: string, referreeId: string, ipAddress: string | null) {
  const referrer = db.select().from(users).where(eq(users.referralCode, referralCode)).get();
  if (!referrer) return null;
  if (referrer.email === referreeEmail) return null;

  const existing = db.select().from(referralEvents)
    .where(and(eq(referralEvents.referrerId, referrer.id), eq(referralEvents.referreeEmail, referreeEmail)))
    .get();
  if (existing) return null;

  db.insert(referralEvents).values({
    id: generateId(),
    referrerId: referrer.id,
    referreeEmail,
    referreeId,
    ipAddress,
    convertedAt: new Date(),
  }).run();

  db.update(users)
    .set({ referralCount: referrer.referralCount + 1, queueScore: referrer.queueScore + 10 })
    .where(eq(users.id, referrer.id))
    .run();

  return true;
}

export async function getQueuePosition(userId: string): Promise<number> {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return 0;

  const [{ ahead }] = db.select({ ahead: count() }).from(users).where(
    or(
      gt(users.queueScore, user.queueScore),
      and(eq(users.queueScore, user.queueScore), sql`${users.createdAt} < ${user.createdAt?.getTime() ?? 0}`)
    )
  ).all();

  return (ahead ?? 0) + 1;
}

export async function getLeaderboard(limit = 50) {
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    referralCode: users.referralCode,
    referralCount: users.referralCount,
    queueScore: users.queueScore,
    createdAt: users.createdAt,
  })
    .from(users)
    .orderBy(desc(users.queueScore), asc(users.createdAt))
    .limit(limit)
    .all();
}

export async function getTotalSignups(): Promise<number> {
  const [{ total }] = db.select({ total: count() }).from(users).all();
  return total ?? 0;
}
