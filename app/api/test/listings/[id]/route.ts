import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const listing = (await db.select().from(listings).where(eq(listings.id, id)))[0];
  if (!listing) return new NextResponse(null, { status: 404 });
  await db.update(listings).set({ views: listing.views + 1 }).where(eq(listings.id, id));
  return NextResponse.json({ listing });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const listing = (await db.select().from(listings).where(eq(listings.id, id)))[0];
  if (!listing) return new NextResponse(null, { status: 404 });
  if (listing.sellerId !== session.userId) return new NextResponse(null, { status: 403 });
  await db.update(listings).set({ status: "deleted" }).where(eq(listings.id, id));
  return NextResponse.json({ success: true });
}
