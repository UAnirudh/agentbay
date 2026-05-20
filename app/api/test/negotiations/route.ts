import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { negotiations, listings } from "@/lib/schema";
import { eq, or, desc } from "drizzle-orm";

export async function GET(_: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const rows = db.select().from(negotiations)
    .where(or(eq(negotiations.buyerId, session.userId), eq(negotiations.sellerId, session.userId)))
    .orderBy(desc(negotiations.updatedAt))
    .limit(50)
    .all();

  const withListings = rows.map((n) => {
    const l = db.select().from(listings).where(eq(listings.id, n.listingId)).get();
    return { ...n, listing: l, history: JSON.parse(n.history) };
  });

  return NextResponse.json({ negotiations: withListings });
}
