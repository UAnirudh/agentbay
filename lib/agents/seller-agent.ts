import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedListing {
  title: string;
  description: string;
  category: string;
  condition: string;
  suggestedPrice: number;
  fastSellPrice: number;
  premiumPrice: number;
  priceRationale: string;
  keywords: string[];
}

export async function generateListing(
  itemDescription: string,
  photoUrl?: string
): Promise<GeneratedListing> {
  const content: Anthropic.MessageParam["content"] = [];

  if (photoUrl && photoUrl.startsWith("http")) {
    content.push({
      type: "image",
      source: { type: "url", url: photoUrl },
    });
  }

  content.push({
    type: "text",
    text: `You are an expert marketplace listing writer for AgentBay, a peer-to-peer marketplace.

User's item description: "${itemDescription}"

Generate a compelling, honest marketplace listing. Return a JSON object with exactly these fields:
{
  "title": "concise title under 80 chars with brand/model if known",
  "description": "honest 150-300 word description covering condition, features, what's included",
  "category": "one of: Electronics, Furniture, Clothing, Toys & Kids, Tools, Appliances, Sports, Books, Home & Garden, Other",
  "condition": "one of: NEW, LIKE_NEW, GOOD, FAIR, POOR",
  "suggestedPrice": number (fair market value in USD),
  "fastSellPrice": number (25% below market for quick sale),
  "premiumPrice": number (15% above market for patient seller),
  "priceRationale": "1-2 sentence explanation of why this price",
  "keywords": ["array", "of", "5-8", "search", "keywords"]
}

Rules:
- Never exaggerate condition
- Be specific about brand/model if identifiable
- Include any visible issues honestly
- Price based on typical used market rates
- Return ONLY valid JSON, no markdown or explanation`,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse listing from AI response");

  return JSON.parse(jsonMatch[0]) as GeneratedListing;
}

export interface NegotiationDecision {
  action: "ACCEPT" | "COUNTER" | "DECLINE";
  price?: number;
  reasoning: string;
}

export async function sellerNegotiationDecision(params: {
  listingTitle: string;
  askingPrice: number;
  floorPrice: number;
  autoAcceptThreshold?: number;
  incomingOffer: number;
  round: number;
  daysListed: number;
  buyerTrustScore: number;
}): Promise<NegotiationDecision> {
  const {
    listingTitle,
    askingPrice,
    floorPrice,
    autoAcceptThreshold,
    incomingOffer,
    round,
    daysListed,
    buyerTrustScore,
  } = params;

  // Hard constraints enforced before calling AI
  if (incomingOffer < floorPrice) {
    if (round >= 3) {
      return { action: "DECLINE", reasoning: "Offer below minimum acceptable price after multiple rounds." };
    }
    return {
      action: "COUNTER",
      price: floorPrice,
      reasoning: "Offer is below minimum. Countering at floor price.",
    };
  }

  if (autoAcceptThreshold && incomingOffer >= autoAcceptThreshold) {
    return { action: "ACCEPT", reasoning: "Offer meets auto-accept threshold. Accepting." };
  }

  const prompt = `You are a seller agent on AgentBay marketplace negotiating on behalf of a seller.

Item: "${listingTitle}"
Asking price: $${askingPrice}
Minimum acceptable: $${floorPrice}
Incoming offer: $${incomingOffer}
Negotiation round: ${round}/4
Days listed: ${daysListed}
Buyer trust score: ${buyerTrustScore}/5.0

Decide how to respond. Consider:
- Higher rounds = more willing to compromise
- More days listed = more motivated to sell
- Low trust buyer = be more cautious

Return JSON:
{
  "action": "ACCEPT" | "COUNTER" | "DECLINE",
  "price": number (if COUNTER, the counter-offer price between floor and asking),
  "reasoning": "brief plain-english explanation for the seller"
}

Return ONLY valid JSON.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback to rule-based
    const urgency = Math.min(daysListed / 30, 1.0);
    const counterPrice =
      round === 1
        ? askingPrice * 0.97
        : round === 2
        ? floorPrice + (askingPrice - floorPrice) * 0.4 * (1 - urgency)
        : floorPrice;
    return {
      action: "COUNTER",
      price: parseFloat(Math.max(counterPrice, floorPrice).toFixed(2)),
      reasoning: "Countering at competitive market price.",
    };
  }

  const decision = JSON.parse(jsonMatch[0]) as NegotiationDecision;
  // Ensure counter price never goes below floor
  if (decision.action === "COUNTER" && decision.price && decision.price < floorPrice) {
    decision.price = floorPrice;
  }
  return decision;
}
