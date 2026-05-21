import { db } from "./db";
import { users, referralEvents } from "./schema";
import { eq, gt, or, and, desc, asc, lt, count } from "drizzle-orm";
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
    const existing = (await db.select().from(users).where(eq(users.referralCode, code)))[0];
    if (!existing) return code;
    code = generateReferralCode();
    attempts++;
  }
  return `${generateReferralCode()}${Date.now().toString(36).toUpperCase()}`;
}

export async function creditReferral(referralCode: string, referreeEmail: string, referreeId: string, ipAddress: string | null) {
  const referrer = (await db.select().from(users).where(eq(users.referralCode, referralCode)))[0];
  if (!referrer) return null;
  if (referrer.email === referreeEmail) return null;

  const existing = (await db.select().from(referralEvents)
    .where(and(eq(referralEvents.referrerId, referrer.id), eq(referralEvents.referreeEmail, referreeEmail))))[0];
  if (existing) return null;

  await db.insert(referralEvents).values({
    id: generateId(),
    referrerId: referrer.id,
    referreeEmail,
    referreeId,
    ipAddress,
    convertedAt: new Date(),
  });

  await db.update(users)
    .set({ referralCount: referrer.referralCount + 1, queueScore: referrer.queueScore + 10 })
    .where(eq(users.id, referrer.id));

  return true;
}

export async function getQueuePosition(userId: string): Promise<number> {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) return 0;

  const [{ ahead }] = await db.select({ ahead: count() }).from(users).where(
    or(
      gt(users.queueScore, user.queueScore),
      and(eq(users.queueScore, user.queueScore), lt(users.createdAt, user.createdAt!))
    )
  );

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
    .limit(limit);
}

export async function getTotalSignups(): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(users);
  return total ?? 0;
}
