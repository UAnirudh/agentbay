import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Buyer confirms receipt — releases funds from escrow
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { negotiationId } = await req.json();

  const transaction = await prisma.transaction.findUnique({
    where: { negotiationId },
  });

  if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (transaction.buyerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (transaction.status !== "IN_ESCROW") {
    return NextResponse.json({ error: "Transaction is not in escrow" }, { status: 400 });
  }

  await prisma.transaction.update({
    where: { negotiationId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
