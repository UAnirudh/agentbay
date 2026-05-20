import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) return new NextResponse(null, { status: 404 });
  db.update(listings).set({ views: listing.views + 1 }).where(eq(listings.id, id)).run();
  return NextResponse.json({ listing });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) return new NextResponse(null, { status: 404 });
  if (listing.sellerId !== session.userId) return new NextResponse(null, { status: 403 });
  db.update(listings).set({ status: "deleted" }).where(eq(listings.id, id)).run();
  return NextResponse.json({ success: true });
}
