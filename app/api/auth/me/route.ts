import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    image: users.image,
    isAdmin: users.isAdmin,
    isApproved: users.isApproved,
    referralCode: users.referralCode,
    referralCount: users.referralCount,
    queueScore: users.queueScore,
  }).from(users).where(eq(users.id, session.userId)).get();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}
