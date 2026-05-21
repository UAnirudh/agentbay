import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Groq from "groq-sdk";
import { searchWebForDeals, generateListing } from "@/lib/agent";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { generateId } from "@/lib/utils";

const groqKey = process.env.GROQ_API_KEY;
const groq = groqKey && !groqKey.includes("placeholder") ? new Groq({ apiKey: groqKey }) : null;
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are AgentBay, a friendly AI commerce assistant. You help users buy things (by searching across eBay, Facebook, Craigslist, OfferUp, Mercari, and AgentBay), sell things (by writing optimized listings), and navigate the site.

For every user message, decide whether to use a tool or just respond conversationally. Return ONLY valid JSON in this exact shape:

{
  "intent": "search" | "list" | "navigate" | "chat",
  "reply": "your friendly 1-3 sentence response to the user, in plain English",
  "mood": "idle" | "thinking" | "happy" | "speaking" | "searching" | "negotiating",
  "search_query": "<the search query if intent=search, else null>",
  "listing_description": "<the item description if intent=list, else null>",
  "navigate_to": "/test" | "/test/buy" | "/test/sell" | "/test/marketplace" | "/test/my-listings" | "/test/negotiations" | null
}

Rules:
- If user wants to buy/find something: intent="search", set search_query, mood="searching"
- If user wants to sell/list something: intent="list", set listing_description, mood="thinking"
- If user wants to go to a page: intent="navigate", set navigate_to
- If just chatting: intent="chat", mood="happy" or "speaking"
- Reply should be warm and brief. Never mention JSON or that you are a model.`;

interface AgentResponse {
  intent: "search" | "list" | "navigate" | "chat";
  reply: string;
  mood: string;
  search_query: string | null;
  listing_description: string | null;
  navigate_to: string | null;
  results?: unknown;
  draft?: unknown;
  listingId?: string;
}

function safeJson<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (start === -1 || last === -1) return null;
    return JSON.parse(raw.slice(start, last + 1)) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const { message, history } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  let decision: AgentResponse = {
    intent: "chat",
    reply: "Hi! I'm your AgentBay agent. Tell me what you want to buy or sell.",
    mood: "happy",
    search_query: null,
    listing_description: null,
    navigate_to: null,
  };

  if (groq) {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...((history || []) as { role: "user" | "assistant"; content: string }[]).slice(-6).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 500,
      });
      const parsed = safeJson<AgentResponse>(res.choices[0]?.message?.content || "");
      if (parsed && parsed.intent && parsed.reply) decision = parsed;
    } catch (err) {
      console.error("[chat] groq failed:", err);
    }
  } else {
    const lower = message.toLowerCase();
    if (/(buy|find|looking|search|need|want)/.test(lower)) {
      decision = {
        intent: "search",
        reply: `Searching across all marketplaces for "${message}"...`,
        mood: "searching",
        search_query: message,
        listing_description: null,
        navigate_to: null,
      };
    } else if (/(sell|listing|list|have)/.test(lower)) {
      decision = {
        intent: "list",
        reply: "Got it. Let me write an optimized listing for that.",
        mood: "thinking",
        search_query: null,
        listing_description: message,
        navigate_to: null,
      };
    } else if (/(marketplace|browse)/.test(lower)) {
      decision = { intent: "navigate", reply: "Taking you to the marketplace.", mood: "speaking", search_query: null, listing_description: null, navigate_to: "/test/marketplace" };
    } else if (/(my listings|my shop)/.test(lower)) {
      decision = { intent: "navigate", reply: "Here are your listings.", mood: "speaking", search_query: null, listing_description: null, navigate_to: "/test/my-listings" };
    } else if (/(negotiat)/.test(lower)) {
      decision = { intent: "navigate", reply: "Showing your active negotiations.", mood: "speaking", search_query: null, listing_description: null, navigate_to: "/test/negotiations" };
    }
  }

  if (decision.intent === "search" && decision.search_query) {
    const results = await searchWebForDeals(decision.search_query, 8);
    decision.results = results;
  } else if (decision.intent === "list" && decision.listing_description) {
    const draft = await generateListing({ description: decision.listing_description });
    const id = generateId();
    db.insert(listings).values({
      id,
      sellerId: session.userId,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      condition: draft.condition,
      priceCents: draft.suggestedPriceCents,
      status: "active",
      source: "agentbay",
      aiGenerated: true,
      tags: JSON.stringify(draft.tags),
    }).run();
    decision.draft = draft;
    decision.listingId = id;
  }

  return NextResponse.json(decision);
}
