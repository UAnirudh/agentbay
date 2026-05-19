import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

Return JSON:
{
  "keywords": "key search terms as a string",
  "category": "one of: Electronics, Furniture, Clothing, Toys & Kids, Tools, Appliances, Sports, Books, Home & Garden, Other, or null if unclear",
  "maxPrice": number or null (extract budget if mentioned),
  "condition": "one of: NEW, LIKE_NEW, GOOD, FAIR, POOR or null if not specified",
  "summary": "1 sentence plain English summary of what the user wants"
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
    return { keywords: query, summary: `Searching for: ${query}` };
  }

  return JSON.parse(jsonMatch[0]) as SearchIntent;
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

  const prompt = `You are a buyer agent on AgentBay marketplace making an opening offer on behalf of a buyer.

Item: "${listingTitle}"
Asking price: $${askingPrice}
Buyer's max budget: $${maxBudget}
Item condition: ${condition}
Seller trust score: ${sellerTrustScore}/5.0
Days listed: ${daysListed}

Determine a smart opening offer that:
- Is between 10-25% below asking price (room to negotiate)
- Does not exceed the buyer's max budget
- Is realistic enough that the seller will engage
- Considers condition (worse condition = lower offer)

Return JSON:
{
  "initialOffer": number,
  "reasoning": "brief explanation for the buyer"
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
    const offer = Math.min(askingPrice * 0.85, maxBudget);
    return {
      initialOffer: parseFloat(offer.toFixed(2)),
      reasoning: "Opening at 15% below asking to leave room for negotiation.",
    };
  }

  const strategy = JSON.parse(jsonMatch[0]) as BuyerOfferStrategy;
  // Never exceed budget
  if (strategy.initialOffer > maxBudget) {
    strategy.initialOffer = maxBudget;
  }
  return strategy;
}

export async function buyerCounterDecision(params: {
  listingTitle: string;
  maxBudget: number;
  sellerCounter: number;
  lastBuyerOffer: number;
  round: number;
}): Promise<{ action: "ACCEPT" | "COUNTER" | "WALK_AWAY"; price?: number; reasoning: string }> {
  const { maxBudget, sellerCounter, lastBuyerOffer, round } = params;

  if (sellerCounter <= maxBudget && round >= 2) {
    return { action: "ACCEPT", reasoning: "Counter is within budget and we've negotiated fairly." };
  }

  if (sellerCounter > maxBudget) {
    if (round >= 3) {
      return { action: "WALK_AWAY", reasoning: "Seller's price exceeds budget after multiple rounds." };
    }
    return {
      action: "COUNTER",
      price: Math.min(maxBudget, lastBuyerOffer * 1.05),
      reasoning: "Improving offer toward budget limit.",
    };
  }

  // Split the difference
  const counter = parseFloat(((lastBuyerOffer + sellerCounter) / 2).toFixed(2));
  return {
    action: "COUNTER",
    price: Math.min(counter, maxBudget),
    reasoning: "Splitting the difference for a fair compromise.",
  };
}
