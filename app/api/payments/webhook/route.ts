import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { negotiationId } = session.metadata || {};

    if (negotiationId) {
      await prisma.transaction.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: "IN_ESCROW" },
      });

      await prisma.listing.updateMany({
        where: { negotiations: { some: { id: negotiationId } } },
        data: { status: "SOLD" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
