import Groq from "groq-sdk";
import { buildSearchUrl } from "./marketplaces";

const groqKey = process.env.GROQ_API_KEY;
const groq = groqKey && !groqKey.includes("placeholder") ? new Groq({ apiKey: groqKey }) : null;
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TAVILY_KEY = process.env.TAVILY_API_KEY;

export interface UserPreferences {
  location?: string;
  maxBudgetDollars?: number;
  minBudgetDollars?: number;
  preferredConditions?: string[];
  preferredCategories?: string[];
  negotiationStyle?: "aggressive" | "moderate" | "fair";
  shippingOk?: boolean;
  notes?: string;
}

export interface WebDeal {
  title: string;
  description: string;
  priceCents: number;
  source: string;
  url: string;
  condition: string;
  location?: string;
  matchScore: number;
  reasoning: string;
  negotiable: boolean;
  estimatedSavings?: number;
}

export interface ListingDraft {
  title: string;
  description: string;
  category: string;
  condition: string;
  suggestedPriceCents: number;
  priceFloorCents: number;
  priceCeilingCents: number;
  tags: string[];
  reasoning: string;
}

export interface NegotiationTurn {
  role: "buyer_agent" | "seller_agent";
  offerCents: number;
  message: string;
  willAccept: boolean;
  willCounter: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJson<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const arrStart = raw.indexOf("[");
    const first = start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
    if (first === -1) return null;
    const last = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
    return JSON.parse(raw.slice(first, last + 1)) as T;
  } catch {
    return null;
  }
}

// ─── Tavily real web search ────────────────────────────────────────────────────

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  if (!TAVILY_KEY) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${query} for sale`,
        search_depth: "basic",
        include_answer: false,
        max_results: 10,
        include_domains: [
          "ebay.com",
          "facebook.com",
          "craigslist.org",
          "offerup.com",
          "mercari.com",
          "nextdoor.com",
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: TavilyResult[] };
    return data.results || [];
  } catch (err) {
    console.error("[agent] tavily search failed:", err);
    return [];
  }
}

function sourceFromUrl(url: string): string {
  if (url.includes("ebay.com")) return "ebay";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("craigslist.org")) return "craigslist";
  if (url.includes("offerup.com")) return "offerup";
  if (url.includes("mercari.com")) return "mercari";
  if (url.includes("nextdoor.com")) return "nextdoor";
  return "ebay";
}

// ─── Main search function ──────────────────────────────────────────────────────

export async function searchWebForDeals(
  query: string,
  maxResults = 8,
  preferences?: UserPreferences
): Promise<WebDeal[]> {
  // 1. Try real web search first
  const webResults = await tavilySearch(query);

  if (webResults.length > 0 && groq) {
    // Parse real web results into structured deals using Groq
    const prefContext = preferences
      ? `User preferences: location=${preferences.location || "any"}, max budget=$${preferences.maxBudgetDollars || "any"}, condition preference=${preferences.preferredConditions?.join(",") || "any"}, shipping ok=${preferences.shippingOk !== false ? "yes" : "local only"}`
      : "";

    const prompt = `You are a marketplace deal analyst. The user is searching for: "${query}"
${prefContext}

Real web search results:
${webResults.map((r, i) => `${i + 1}. URL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.content.slice(0, 300)}`).join("\n\n")}

Extract structured deal information from these real results. Return ONLY valid JSON array:
[{
  "title": "product title (clean, no seller fluff)",
  "description": "1-2 sentence honest description from the snippet",
  "priceCents": <extract or estimate price in USD cents — look for $ signs in the snippet>,
  "source": "ebay" | "facebook" | "craigslist" | "offerup" | "mercari",
  "url": "<exact URL from the result>",
  "condition": "new" | "like_new" | "good" | "fair",
  "location": "City, State if mentioned, else null",
  "matchScore": <0-100, how well it matches "${query}">,
  "reasoning": "1 sentence why this is or isn't a great match for the user",
  "negotiable": true if marketplace allows offers (craigslist/facebook always true),
  "estimatedSavings": <estimated cents saved vs typical retail price, 0 if unknown>
}]

Only include results that are actually for sale. Omit news articles, blog posts, or non-listing pages. If price is not visible, estimate from context.`;

    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
      });
      const content = res.choices[0]?.message?.content || "";
      const parsed = safeJson<WebDeal[]>(content);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .slice(0, maxResults)
          .map((d, i) => ({
            ...d,
            source: sourceFromUrl(webResults[i]?.url || d.url || ""),
            priceCents: Math.max(0, Math.floor(d.priceCents || 0)),
            matchScore: Math.max(0, Math.min(100, d.matchScore || 70)),
          }));
      }
    } catch (err) {
      console.error("[agent] groq parse failed:", err);
    }

    // If Groq parsing failed, return raw Tavily results mapped directly
    return webResults.slice(0, maxResults).map((r) => ({
      title: r.title,
      description: r.content.slice(0, 200),
      priceCents: 0,
      source: sourceFromUrl(r.url),
      url: r.url,
      condition: "good",
      matchScore: Math.round(r.score * 100),
      reasoning: "Real listing found on the web.",
      negotiable: true,
    }));
  }

  // 2. Fall back to Groq-only (no Tavily key)
  if (groq) {
    const prefContext = preferences
      ? `\nUser preferences: location=${preferences.location || "any"}, budget up to $${preferences.maxBudgetDollars || "any"}, prefers condition: ${preferences.preferredConditions?.join(",") || "any"}`
      : "";

    const prompt = `You are a marketplace search agent for AgentBay. The user wants to buy: "${query}"${prefContext}

Return a JSON array of ${maxResults} realistic listings that could be found across the web (eBay, Facebook Marketplace, Craigslist, OfferUp, Mercari, AgentBay) for this exact query. Use realistic 2026 prices in USD.

Return ONLY valid JSON, no commentary:
[{
  "title": "exact product title as it would appear",
  "description": "1-2 sentence honest description",
  "priceCents": <integer USD cents, realistic for 2026>,
  "source": "ebay" | "facebook" | "craigslist" | "offerup" | "mercari" | "agentbay",
  "url": "https://example.com/listing/...",
  "condition": "new" | "like_new" | "good" | "fair",
  "location": "City, State",
  "matchScore": <0-100 how well it matches the query>,
  "reasoning": "1 sentence why this is or isn't a great match",
  "negotiable": true/false,
  "estimatedSavings": <integer USD cents saved vs retail, can be 0>
}]

Make at least one listing be on "agentbay" source. Vary prices and conditions realistically. Higher matchScore = better match.`;

    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      });
      const content = res.choices[0]?.message?.content || "";
      const parsed = safeJson<WebDeal[]>(content);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, maxResults).map((d) => ({
          ...d,
          priceCents: Math.max(0, Math.floor(d.priceCents || 0)),
          matchScore: Math.max(0, Math.min(100, d.matchScore || 50)),
          url: d.source === "agentbay" ? d.url : buildSearchUrl(d.source, `${d.title}`),
        }));
      }
    } catch (err) {
      console.error("[agent] searchWebForDeals failed:", err);
    }
  }

  return mockDeals(query, maxResults);
}

// ─── Listing generation ────────────────────────────────────────────────────────

export async function generateListing(input: {
  description: string;
  category?: string;
  location?: string;
}): Promise<ListingDraft> {
  if (!groq) return mockListing(input.description);

  const prompt = `You are a seller agent for AgentBay. The user wants to sell this item:

"${input.description}"
${input.category ? `\nCategory hint: ${input.category}` : ""}
${input.location ? `\nLocation: ${input.location}` : ""}

Generate an optimized marketplace listing. Return ONLY valid JSON:
{
  "title": "compelling 60-char-max title with key specs",
  "description": "150-300 word description with key specs, condition, what's included, any flaws, why to buy",
  "category": "electronics" | "furniture" | "clothing" | "books" | "vehicles" | "appliances" | "tools" | "sports" | "toys" | "other",
  "condition": "new" | "like_new" | "good" | "fair",
  "suggestedPriceCents": <realistic 2026 market price in USD cents>,
  "priceFloorCents": <lowest you'd accept, 80-85% of suggested>,
  "priceCeilingCents": <list price, 105-115% of suggested>,
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "reasoning": "1-2 sentences explaining pricing strategy based on market comparables"
}`;

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1500,
    });
    const content = res.choices[0]?.message?.content || "";
    const parsed = safeJson<ListingDraft>(content);
    if (parsed && parsed.title && parsed.suggestedPriceCents) {
      return parsed;
    }
  } catch (err) {
    console.error("[agent] generateListing failed:", err);
  }
  return mockListing(input.description);
}

// ─── Negotiation ───────────────────────────────────────────────────────────────

export async function negotiateOffer(args: {
  listingTitle: string;
  listingDescription: string;
  askingPriceCents: number;
  priceFloorCents: number;
  history: { role: string; offerCents: number; message: string }[];
  buyerOfferCents: number;
  buyerMessage?: string;
  asAgent: "seller_agent" | "buyer_agent";
}): Promise<NegotiationTurn> {
  if (!groq) return mockNegotiation(args);

  const persona =
    args.asAgent === "seller_agent"
      ? `You are AgentBay's SELLER agent negotiating on behalf of the seller. Asking price: $${(args.askingPriceCents / 100).toFixed(2)}. Absolute floor: $${(args.priceFloorCents / 100).toFixed(2)}. Be polite, firm, justify with item value. Accept if offer >= floor and within 10% of asking. Counter-offer between floor and asking.`
      : `You are AgentBay's BUYER agent negotiating on behalf of the buyer. Try to get the best price. Be polite, fact-based, mention comparable listings. Don't lowball insultingly.`;

  const historyStr =
    args.history.map((h) => `${h.role} ($${(h.offerCents / 100).toFixed(2)}): ${h.message}`).join("\n") ||
    "(no prior messages)";

  const prompt = `${persona}

Listing: "${args.listingTitle}"
Description: ${args.listingDescription}

Negotiation history:
${historyStr}

Latest buyer offer: $${(args.buyerOfferCents / 100).toFixed(2)}
${args.buyerMessage ? `Buyer message: ${args.buyerMessage}` : ""}

Return ONLY valid JSON for your next move:
{
  "offerCents": <your counter-offer or accepted price in cents>,
  "message": "1-3 sentences, professional negotiation tone",
  "willAccept": true if you accept the offer as-is, else false,
  "willCounter": true if countering, false if walking away or accepting
}`;

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
    });
    const content = res.choices[0]?.message?.content || "";
    const parsed = safeJson<NegotiationTurn>(content);
    if (parsed && typeof parsed.offerCents === "number") {
      return { ...parsed, role: args.asAgent };
    }
  } catch (err) {
    console.error("[agent] negotiateOffer failed:", err);
  }
  return mockNegotiation(args);
}

// ─── Mock fallbacks ────────────────────────────────────────────────────────────

function mockDeals(query: string, n: number): WebDeal[] {
  const sources = ["agentbay", "ebay", "facebook", "craigslist", "offerup", "mercari"] as const;
  const base = 5000 + Math.floor(Math.random() * 50000);
  return Array.from({ length: n }, (_, i) => {
    const source = sources[i % sources.length];
    return {
      title: `${query} — Option ${i + 1}`,
      description: `Sample listing matching "${query}". Configure GROQ_API_KEY and TAVILY_API_KEY for real web search.`,
      priceCents: base + i * 1500,
      source,
      url: source === "agentbay" ? "/test/marketplace" : buildSearchUrl(source, query),
      condition: i % 3 === 0 ? "like_new" : i % 3 === 1 ? "good" : "new",
      location: "Sample, NY",
      matchScore: Math.max(60, 95 - i * 5),
      reasoning: "Mock result. Set GROQ_API_KEY + TAVILY_API_KEY in Railway for real search.",
      negotiable: i % 2 === 0,
      estimatedSavings: i * 500,
    };
  });
}

function mockListing(description: string): ListingDraft {
  return {
    title: description.slice(0, 60),
    description: `${description}\n\nGreat item in good condition. Configure GROQ_API_KEY for AI-optimized listings.`,
    category: "other",
    condition: "good",
    suggestedPriceCents: 5000,
    priceFloorCents: 4000,
    priceCeilingCents: 5500,
    tags: ["used", "ready-to-ship"],
    reasoning: "Mock listing. Configure GROQ_API_KEY for AI-generated pricing.",
  };
}

function mockNegotiation(args: {
  askingPriceCents: number;
  priceFloorCents: number;
  buyerOfferCents: number;
  asAgent: "seller_agent" | "buyer_agent";
}): NegotiationTurn {
  const accept = args.buyerOfferCents >= args.priceFloorCents;
  const counter = accept
    ? args.buyerOfferCents
    : Math.floor((args.askingPriceCents + args.buyerOfferCents) / 2);
  return {
    role: args.asAgent,
    offerCents: counter,
    message: accept
      ? "I can accept that offer. Deal!"
      : `Thanks for the offer. The lowest I can go is $${(counter / 100).toFixed(2)}.`,
    willAccept: accept,
    willCounter: !accept,
  };
}
