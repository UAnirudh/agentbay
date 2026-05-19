import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fast model for simple tasks, powerful model for complex generation
const FAST_MODEL = "llama-3.1-8b-instant";
const SMART_MODEL = "llama-3.3-70b-versatile";

async function chat(model: string, prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
  });
  return response.choices[0]?.message?.content ?? "";
}

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
  const photoNote = photoUrl
    ? `The seller also provided this image URL for reference: ${photoUrl}`
    : "No photo provided — base your assessment on the description alone.";

  const prompt = `You are an expert marketplace listing writer for AgentBay, a peer-to-peer resale marketplace.

Seller's item description: "${itemDescription}"
${photoNote}

Generate a compelling, honest marketplace listing. Return a JSON object with exactly these fields:
{
  "title": "concise title under 80 chars with brand/model if known",
  "description": "honest 150-300 word description covering condition, features, what's included",
  "category": "one of: Electronics, Furniture, Clothing, Toys & Kids, Tools, Appliances, Sports, Books, Home & Garden, Other",
  "condition": "one of: NEW, LIKE_NEW, GOOD, FAIR, POOR",
  "suggestedPrice": number (fair market USD value for used condition),
  "fastSellPrice": number (25% below market for quick sale),
  "premiumPrice": number (15% above market for patient seller),
  "priceRationale": "1-2 sentence explanation of the pricing",
  "keywords": ["array", "of", "5-8", "search", "keywords"]
}

Rules:
- Never exaggerate condition or capabilities
- Be specific about brand/model if identifiable from the description
- Include any mentioned issues honestly
- Price based on typical US used market rates
- Return ONLY valid JSON, no markdown fences or extra text`;

  const text = await chat(SMART_MODEL, prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return a valid listing — please try again.");

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

  // Hard server-side guards — never overridden by AI
  if (incomingOffer < floorPrice) {
    if (round >= 3) {
      return { action: "DECLINE", reasoning: "Offer is below the minimum acceptable price after multiple rounds." };
    }
    return {
      action: "COUNTER",
      price: floorPrice,
      reasoning: "Offer is below the seller's minimum. Countering at the floor price.",
    };
  }

  if (autoAcceptThreshold && incomingOffer >= autoAcceptThreshold) {
    return { action: "ACCEPT", reasoning: "Offer meets or exceeds auto-accept threshold." };
  }

  const prompt = `You are a seller agent on AgentBay marketplace. Decide how to respond to an incoming offer.

Item: "${listingTitle}"
Asking price: $${askingPrice}
Minimum acceptable price: $${floorPrice}
Incoming buyer offer: $${incomingOffer}
Negotiation round: ${round} of 4
Days listed: ${daysListed}
Buyer trust score: ${buyerTrustScore.toFixed(1)}/5.0

Strategy guidelines:
- Round 1-2: Counter closer to asking price (room to negotiate)
- Round 3-4: Move closer to floor price (urgency increases)
- More days listed = more willing to accept lower prices
- Low trust buyer (<3.5) = be more conservative

Return ONLY this JSON (no markdown):
{
  "action": "ACCEPT" | "COUNTER" | "DECLINE",
  "price": number (required if COUNTER — must be between $${floorPrice} and $${askingPrice}),
  "reasoning": "brief plain-english explanation for the seller (1-2 sentences)"
}`;

  const text = await chat(FAST_MODEL, prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // Rule-based fallback
    const urgency = Math.min(daysListed / 30, 1.0);
    const counterPrice =
      round <= 1
        ? askingPrice * 0.97
        : round === 2
        ? floorPrice + (askingPrice - floorPrice) * 0.4 * (1 - urgency)
        : floorPrice + (askingPrice - floorPrice) * 0.1;
    return {
      action: "COUNTER",
      price: parseFloat(Math.max(counterPrice, floorPrice).toFixed(2)),
      reasoning: "Countering at a competitive price based on market norms.",
    };
  }

  const decision = JSON.parse(jsonMatch[0]) as NegotiationDecision;
  if (decision.action === "COUNTER" && decision.price && decision.price < floorPrice) {
    decision.price = floorPrice;
    decision.reasoning += " (adjusted to floor price)";
  }
  return decision;
}
