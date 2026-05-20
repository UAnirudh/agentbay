import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, negotiations } from "@/lib/schema";
import { negotiateOffer } from "@/lib/agent";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const { listingId, offerCents, message, negotiationId } = await req.json();

  let neg = negotiationId ? db.select().from(negotiations).where(eq(negotiations.id, negotiationId)).get() : null;
  let listing;

  if (neg) {
    listing = db.select().from(listings).where(eq(listings.id, neg.listingId)).get();
  } else {
    listing = db.select().from(listings).where(eq(listings.id, listingId)).get();
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    const newId = generateId();
    db.insert(negotiations).values({
      id: newId,
      listingId: listing.id,
      buyerId: session.userId,
      sellerId: listing.sellerId,
      initialPriceCents: listing.priceCents,
      currentOfferCents: offerCents,
      status: "active",
      lastTurn: "buyer",
      history: JSON.stringify([]),
    }).run();
    neg = db.select().from(negotiations).where(eq(negotiations.id, newId)).get()!;
  }

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const history = JSON.parse(neg.history) as { role: string; offerCents: number; message: string }[];

  history.push({
    role: "buyer",
    offerCents,
    message: message || `Offering $${(offerCents / 100).toFixed(2)}`,
  });

  const floorCents = Math.floor(listing.priceCents * 0.8);
  const agentResponse = await negotiateOffer({
    listingTitle: listing.title,
    listingDescription: listing.description,
    askingPriceCents: listing.priceCents,
    priceFloorCents: floorCents,
    history: history.slice(0, -1),
    buyerOfferCents: offerCents,
    buyerMessage: message,
    asAgent: "seller_agent",
  });

  history.push({
    role: "seller_agent",
    offerCents: agentResponse.offerCents,
    message: agentResponse.message,
  });

  const status = agentResponse.willAccept ? "accepted" : "active";
  const finalPrice = agentResponse.willAccept ? offerCents : null;

  db.update(negotiations).set({
    currentOfferCents: agentResponse.offerCents,
    status,
    finalPriceCents: finalPrice,
    history: JSON.stringify(history),
    lastTurn: "seller_agent",
    updatedAt: new Date(),
  }).where(eq(negotiations.id, neg.id)).run();

  return NextResponse.json({
    negotiation: db.select().from(negotiations).where(eq(negotiations.id, neg.id)).get(),
    agentResponse,
  });
}
