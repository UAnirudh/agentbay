import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, trustScore: true, identityLevel: true, createdAt: true } },
      negotiations: {
        where: { status: { not: "DECLINED" } },
        select: { id: true, status: true, buyerId: true },
      },
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Increment view count
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return NextResponse.json({ listing });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      askingPrice: body.askingPrice ? parseFloat(body.askingPrice) : undefined,
      floorPrice: body.floorPrice ? parseFloat(body.floorPrice) : undefined,
      status: body.status,
      photoUrl: body.photoUrl,
    },
  });

  return NextResponse.json({ listing: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.listing.update({ where: { id }, data: { status: "DELETED" } });
  return NextResponse.json({ success: true });
}
