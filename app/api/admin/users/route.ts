import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      referralCode: users.referralCode,
      referralCount: users.referralCount,
      queueScore: users.queueScore,
      isApproved: users.isApproved,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      lastLogin: users.lastLogin,
      referredBy: users.referredBy,
    }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(users),
  ]);

  return NextResponse.json({ users: rows, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const { userId, isApproved } = body;

  if (!userId || typeof isApproved !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db.update(users).set({ isApproved }).where(eq(users.id, userId));
  const user = (await db.select({ id: users.id, email: users.email, isApproved: users.isApproved })
    .from(users).where(eq(users.id, userId)))[0];

  return NextResponse.json({ user });
}
