import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQueuePosition, getTotalSignups } from "@/lib/referral";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = (await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    referralCode: users.referralCode,
    referralCount: users.referralCount,
    queueScore: users.queueScore,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, session.userId)))[0];

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [position, total] = await Promise.all([
    getQueuePosition(user.id),
    getTotalSignups(),
  ]);

  return NextResponse.json({ user, position, total });
}
