import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FAST_MODEL = "llama-3.1-8b-instant";

async function chat(model: string, prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 512,
  });
  return response.choices[0]?.message?.content ?? "";
}

export interface SearchIntent {
  keywords: string;
  category?: string;
  maxPrice?: number;
  condition?: string;
  summary: string;
}

export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  const prompt = `You are a buyer agent on AgentBay marketplace. Parse this natural language search query into structured search parameters.

Query: "${query}"

Return ONLY this JSON (no markdown):
{
  "keywords": "key search terms as a string",
  "category": "one of: Electronics, Furniture, Clothing, Toys & Kids, Tools, Appliances, Sports, Books, Home & Garden, Other — or null if unclear",
  "maxPrice": number or null (extract dollar budget if mentioned, e.g. "under $300" → 300),
  "condition": "one of: NEW, LIKE_NEW, GOOD, FAIR, POOR — or null if not specified",
  "summary": "1 sentence plain English summary of exactly what the user is looking for"
}`;

  const text = await chat(FAST_MODEL, prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return { keywords: query, summary: `Searching for: ${query}` };
  }

  try {
    return JSON.parse(jsonMatch[0]) as SearchIntent;
  } catch {
    return { keywords: query, summary: `Searching for: ${query}` };
  }
}

export interface BuyerOfferStrategy {
  initialOffer: number;
  reasoning: string;
}

export async function determineBuyerOffer(params: {
  listingTitle: string;
  askingPrice: number;
  maxBudget: number;
  condition: string;
  sellerTrustScore: number;
  daysListed: number;
}): Promise<BuyerOfferStrategy> {
  const { listingTitle, askingPrice, maxBudget, condition, sellerTrustScore, daysListed } = params;

  const prompt = `You are a buyer agent on AgentBay marketplace. Determine a smart opening offer.

Item: "${listingTitle}"
Asking price: $${askingPrice}
Buyer's maximum budget: $${maxBudget}
Item condition: ${condition}
Seller trust score: ${sellerTrustScore.toFixed(1)}/5.0
Days listed: ${daysListed}

Rules:
- Opening offer should be 10-20% below asking price (leave negotiation room)
- Never exceed the buyer's max budget of $${maxBudget}
- Worse condition = lower opening offer
- Long-listed items = slightly lower offer (motivated seller)
- Must be a realistic offer the seller will engage with (not insultingly low)

Return ONLY this JSON (no markdown):
{
  "initialOffer": number,
  "reasoning": "1-2 sentence explanation for the buyer"
}`;

  const text = await chat(FAST_MODEL, prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    const offer = Math.min(askingPrice * 0.85, maxBudget);
    return {
      initialOffer: parseFloat(offer.toFixed(2)),
      reasoning: "Opening 15% below asking to leave room for negotiation.",
    };
  }

  try {
    const strategy = JSON.parse(jsonMatch[0]) as BuyerOfferStrategy;
    if (strategy.initialOffer > maxBudget) {
      strategy.initialOffer = maxBudget;
      strategy.reasoning += " (capped at your budget)";
    }
    return strategy;
  } catch {
    const offer = Math.min(askingPrice * 0.85, maxBudget);
    return { initialOffer: parseFloat(offer.toFixed(2)), reasoning: "Opening below asking price." };
  }
}

export async function buyerCounterDecision(params: {
  listingTitle: string;
  maxBudget: number;
  sellerCounter: number;
  lastBuyerOffer: number;
  round: number;
}): Promise<{ action: "ACCEPT" | "COUNTER" | "WALK_AWAY"; price?: number; reasoning: string }> {
  const { maxBudget, sellerCounter, lastBuyerOffer, round } = params;

  // Simple rule-based logic — fast and predictable for counters
  if (sellerCounter <= maxBudget) {
    if (round >= 2) {
      return { action: "ACCEPT", reasoning: "Counter is within budget. Accepting for a fair deal." };
    }
    // Split the difference on round 1
    const split = parseFloat(((lastBuyerOffer + sellerCounter) / 2).toFixed(2));
    return {
      action: "COUNTER",
      price: Math.min(split, maxBudget),
      reasoning: "Splitting the difference toward a fair price.",
    };
  }

  if (sellerCounter > maxBudget) {
    if (round >= 3) {
      return { action: "WALK_AWAY", reasoning: "Seller's price exceeds budget after multiple rounds." };
    }
    return {
      action: "COUNTER",
      price: maxBudget,
      reasoning: "Moving to max budget — final offer.",
    };
  }

  const counter = parseFloat(((lastBuyerOffer + sellerCounter) / 2).toFixed(2));
  return {
    action: "COUNTER",
    price: Math.min(counter, maxBudget),
    reasoning: "Meeting in the middle.",
  };
}
