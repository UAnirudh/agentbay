import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { determineBuyerOffer } from "@/lib/agents/buyer-agent";
import { sellerNegotiationDecision } from "@/lib/agents/seller-agent";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const negotiations = await prisma.negotiation.findMany({
    where: {
      OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
    },
    include: {
      listing: { select: { id: true, title: true, askingPrice: true, photoUrl: true } },
      buyer: { select: { id: true, name: true, trustScore: true } },
      seller: { select: { id: true, name: true, trustScore: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ negotiations });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { listingId, maxBudget } = await req.json();
    if (!listingId || !maxBudget) {
      return NextResponse.json({ error: "Listing ID and max budget required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true, trustScore: true, agentConfig: true } } },
    });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.status !== "ACTIVE") return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
    if (listing.sellerId === session.userId) {
      return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });
    }

    // Check existing active negotiation
    const existing = await prisma.negotiation.findFirst({
      where: { listingId, buyerId: session.userId, status: "ACTIVE" },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have an active negotiation for this listing" }, { status: 409 });
    }

    const daysListed = Math.floor(
      (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Buyer agent determines opening offer
    const buyerStrategy = await determineBuyerOffer({
      listingTitle: listing.title,
      askingPrice: listing.askingPrice,
      maxBudget,
      condition: listing.condition,
      sellerTrustScore: listing.seller.trustScore,
      daysListed,
    });

    const buyer = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!buyer) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Create negotiation and first buyer message
    const negotiation = await prisma.negotiation.create({
      data: {
        listingId,
        buyerId: session.userId,
        sellerId: listing.sellerId,
        messages: {
          create: {
            fromRole: "BUYER",
            messageType: "OFFER",
            price: buyerStrategy.initialOffer,
            agentReasoning: buyerStrategy.reasoning,
          },
        },
      },
      include: { messages: true },
    });

    // Check seller's agent config for auto-negotiation
    let agentConfig: { autonomyLevel?: number } = {};
    try { agentConfig = JSON.parse(listing.seller.agentConfig); } catch { /* ignore */ }
    const sellerAutonomy = agentConfig.autonomyLevel ?? 2;

    if (sellerAutonomy >= 2) {
      // Seller agent auto-responds
      const sellerDecision = await sellerNegotiationDecision({
        listingTitle: listing.title,
        askingPrice: listing.askingPrice,
        floorPrice: listing.floorPrice ?? listing.askingPrice * 0.8,
        autoAcceptThreshold: listing.autoAcceptThreshold ?? undefined,
        incomingOffer: buyerStrategy.initialOffer,
        round: 1,
        daysListed,
        buyerTrustScore: buyer.trustScore,
      });

      await prisma.negotiationMessage.create({
        data: {
          negotiationId: negotiation.id,
          fromRole: "SELLER",
          messageType: sellerDecision.action,
          price: sellerDecision.price ?? buyerStrategy.initialOffer,
          agentReasoning: sellerDecision.reasoning,
        },
      });

      if (sellerDecision.action === "ACCEPT") {
        await prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { status: "DEAL_REACHED", finalPrice: buyerStrategy.initialOffer, completedAt: new Date() },
        });
      } else if (sellerDecision.action === "DECLINE") {
        await prisma.negotiation.update({
          where: { id: negotiation.id },
          data: { status: "DECLINED", completedAt: new Date() },
        });
      }
    }

    const full = await prisma.negotiation.findUnique({
      where: { id: negotiation.id },
      include: {
        listing: { select: { id: true, title: true, askingPrice: true, photoUrl: true } },
        messages: { orderBy: { createdAt: "asc" } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ negotiation: full }, { status: 201 });
  } catch (error) {
    console.error("Create negotiation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
