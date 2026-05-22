import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const user = (await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, session.userId)))[0];
  const prefs = user?.preferences ? JSON.parse(user.preferences) : {};
  return NextResponse.json({ preferences: prefs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const body = await req.json();
  const allowed = ["location", "maxBudgetDollars", "minBudgetDollars", "preferredConditions", "preferredCategories", "negotiationStyle", "shippingOk", "notes"];
  const prefs: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) prefs[key] = body[key];
  }

  await db.update(users)
    .set({ preferences: JSON.stringify(prefs) })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ preferences: prefs, ok: true });
}
