import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sellerNegotiationDecision } from "@/lib/agents/seller-agent";
import { buyerCounterDecision } from "@/lib/agents/buyer-agent";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const negotiation = await prisma.negotiation.findUnique({
    where: { id },
    include: {
      listing: true,
      messages: { orderBy: { createdAt: "asc" } },
      buyer: true,
      seller: true,
    },
  });

  if (!negotiation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (negotiation.status !== "ACTIVE") {
    return NextResponse.json({ error: "Negotiation is no longer active" }, { status: 400 });
  }

  const isBuyer = negotiation.buyerId === session.userId;
  const isSeller = negotiation.sellerId === session.userId;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, price, useAgent, maxBudget } = body;

  const round = Math.floor(negotiation.messages.length / 2) + 1;
  const lastMsg = negotiation.messages[negotiation.messages.length - 1];
  const daysListed = Math.floor(
    (Date.now() - new Date(negotiation.listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  let finalAction: string;
  let finalPrice: number;
  let reasoning: string;

  if (isSeller) {
    if (useAgent) {
      const decision = await sellerNegotiationDecision({
        listingTitle: negotiation.listing.title,
        askingPrice: negotiation.listing.askingPrice,
        floorPrice: negotiation.listing.floorPrice ?? negotiation.listing.askingPrice * 0.8,
        autoAcceptThreshold: negotiation.listing.autoAcceptThreshold ?? undefined,
        incomingOffer: lastMsg.price,
        round,
        daysListed,
        buyerTrustScore: negotiation.buyer.trustScore,
      });
      finalAction = decision.action;
      finalPrice = decision.price ?? lastMsg.price;
      reasoning = decision.reasoning;
    } else {
      finalAction = action;
      finalPrice = price ?? lastMsg.price;
      reasoning = "Seller responded manually.";
    }
  } else {
    // Buyer responding to a seller counter
    if (useAgent && maxBudget) {
      const lastBuyerMsg = [...negotiation.messages].reverse().find((m) => m.fromRole === "BUYER");
      const decision = await buyerCounterDecision({
        listingTitle: negotiation.listing.title,
        maxBudget,
        sellerCounter: lastMsg.price,
        lastBuyerOffer: lastBuyerMsg?.price ?? lastMsg.price,
        round,
      });
      finalAction = decision.action === "WALK_AWAY" ? "DECLINE" : decision.action;
      finalPrice = decision.price ?? lastMsg.price;
      reasoning = decision.reasoning;
    } else {
      finalAction = action;
      finalPrice = price ?? lastMsg.price;
      reasoning = "Buyer responded manually.";
    }
  }

  // Create the response message
  await prisma.negotiationMessage.create({
    data: {
      negotiationId: id,
      fromRole: isSeller ? "SELLER" : "BUYER",
      messageType: finalAction,
      price: finalPrice,
      agentReasoning: reasoning,
    },
  });

  // Update negotiation status
  let newStatus = "ACTIVE";
  let finalNegPrice: number | null = null;

  if (finalAction === "ACCEPT") {
    newStatus = "DEAL_REACHED";
    finalNegPrice = finalPrice;
  } else if (finalAction === "DECLINE") {
    newStatus = "DECLINED";
  } else if (round >= 4) {
    newStatus = "EXPIRED";
  }

  const updated = await prisma.negotiation.update({
    where: { id },
    data: {
      status: newStatus,
      finalPrice: finalNegPrice,
      completedAt: newStatus !== "ACTIVE" ? new Date() : null,
    },
    include: {
      listing: true,
      messages: { orderBy: { createdAt: "asc" } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ negotiation: updated });
}
