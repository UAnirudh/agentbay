import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, calculateFees } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { negotiationId } = await req.json();

    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { listing: true, buyer: true, seller: true, transaction: true },
    });

    if (!negotiation) return NextResponse.json({ error: "Negotiation not found" }, { status: 404 });
    if (negotiation.buyerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (negotiation.status !== "DEAL_REACHED") {
      return NextResponse.json({ error: "No deal has been reached yet" }, { status: 400 });
    }
    if (negotiation.transaction) {
      return NextResponse.json({ error: "Payment already initiated" }, { status: 409 });
    }

    const amount = negotiation.finalPrice!;
    const { platformFee, sellerPayout } = calculateFees(amount);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: negotiation.listing.title,
              description: `Purchase from ${negotiation.seller.name}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/dashboard/negotiations/${negotiationId}?payment=success`,
      cancel_url: `${appUrl}/dashboard/negotiations/${negotiationId}?payment=cancelled`,
      metadata: {
        negotiationId,
        buyerId: session.userId,
        sellerId: negotiation.sellerId,
        amount: amount.toString(),
        platformFee: platformFee.toString(),
        sellerPayout: sellerPayout.toString(),
      },
    });

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        negotiationId,
        buyerId: session.userId,
        sellerId: negotiation.sellerId,
        amount,
        platformFee,
        sellerPayout,
        stripeSessionId: checkoutSession.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
