import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { desc, asc, count } from "drizzle-orm";
import { anonymizeEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(parseInt(limitParam || "50"), 100);

  const all = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    referralCount: users.referralCount,
    queueScore: users.queueScore,
    createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.queueScore), asc(users.createdAt))
    .limit(limit);

  const leaderboard = all.map((u, i) => ({
    id: u.id,
    position: i + 1,
    name: u.name,
    email: anonymizeEmail(u.email),
    referralCount: u.referralCount,
    queueScore: u.queueScore,
    joinedAt: u.createdAt,
  }));

  const [{ total }] = await db.select({ total: count() }).from(users);

  return NextResponse.json({ leaderboard, total }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
