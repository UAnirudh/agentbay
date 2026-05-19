import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export const PLATFORM_FEE_PERCENT = 0.08;

export function calculateFees(amount: number) {
  const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT).toFixed(2));
  const sellerPayout = parseFloat((amount - platformFee).toFixed(2));
  return { platformFee, sellerPayout };
}
