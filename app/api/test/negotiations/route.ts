import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { negotiations, listings } from "@/lib/schema";
import { eq, or, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const rows = await db.select().from(negotiations)
    .where(or(eq(negotiations.buyerId, session.userId), eq(negotiations.sellerId, session.userId)))
    .orderBy(desc(negotiations.updatedAt))
    .limit(50);

  const withListings = await Promise.all(rows.map(async (n) => {
    const l = (await db.select().from(listings).where(eq(listings.id, n.listingId)))[0];
    return { ...n, listing: l, history: JSON.parse(n.history) };
  }));

  return NextResponse.json({ negotiations: withListings });
}
