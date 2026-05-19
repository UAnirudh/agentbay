import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const negotiation = await prisma.negotiation.findUnique({
    where: { id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, trustScore: true } },
      seller: { select: { id: true, name: true, trustScore: true } },
      messages: { orderBy: { createdAt: "asc" } },
      transaction: true,
    },
  });

  if (!negotiation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (negotiation.buyerId !== session.userId && negotiation.sellerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ negotiation });
}
