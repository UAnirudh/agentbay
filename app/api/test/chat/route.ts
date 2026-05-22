import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Groq from "groq-sdk";
import { searchWebForDeals, generateListing, type UserPreferences } from "@/lib/agent";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/schema";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const groqKey = process.env.GROQ_API_KEY;
const groq = groqKey && !groqKey.includes("placeholder") ? new Groq({ apiKey: groqKey }) : null;
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function buildSystemPrompt(prefs?: UserPreferences): string {
  const prefSummary = prefs
    ? [
        prefs.location ? `Location: ${prefs.location}` : null,
        prefs.maxBudgetDollars ? `Max budget: $${prefs.maxBudgetDollars}` : null,
        prefs.preferredConditions?.length ? `Preferred condition: ${prefs.preferredConditions.join(", ")}` : null,
        prefs.preferredCategories?.length ? `Interested in: ${prefs.preferredCategories.join(", ")}` : null,
        prefs.negotiationStyle ? `Negotiation style: ${prefs.negotiationStyle}` : null,
        prefs.shippingOk === false ? "Local pickup only" : null,
        prefs.notes ? `Notes: ${prefs.notes}` : null,
      ]
        .filter(Boolean)
        .join("; ")
    : null;

  return `You are AgentBay, a friendly and sharp AI commerce agent. You help users buy things (searching eBay, Facebook Marketplace, Craigslist, OfferUp, Mercari, and AgentBay's own marketplace), sell things (writing optimized listings), and navigate the platform.
${prefSummary ? `\nThis user's saved preferences: ${prefSummary}\nUse these automatically — don't ask about things they've already set.` : ""}

IMPORTANT BEHAVIOR RULES:
1. For buying requests: if the user hasn't given you enough to search (missing budget OR what they're looking for), ask ONE concise follow-up question to clarify. Only ask ONE thing at a time. Example: "What's your budget for that?" or "Do you need local pickup, or is shipping okay?"
2. If the user has given enough detail (item + some budget/preference), go ahead and search immediately (intent="search"). Don't over-clarify.
3. For selling: if you understand what they're selling, generate the listing immediately (intent="list"). Ask for more detail only if the description is completely vague.
4. Remember the conversation — if they already answered a clarifying question, don't ask again.
5. Be warm, direct, and brief. No walls of text.

Return ONLY valid JSON in this exact shape — no other text:
{
  "intent": "search" | "list" | "clarify" | "navigate" | "chat",
  "reply": "your warm, brief 1-3 sentence response",
  "mood": "idle" | "thinking" | "happy" | "speaking" | "searching" | "negotiating",
  "search_query": "<refined search query if intent=search, else null>",
  "listing_description": "<item description if intent=list, else null>",
  "navigate_to": "/test" | "/test/buy" | "/test/sell" | "/test/marketplace" | "/test/my-listings" | "/test/negotiations" | "/test/preferences" | null,
  "clarifying_question": "<the single question you're asking if intent=clarify, else null>"
}`;
}

interface AgentDecision {
  intent: "search" | "list" | "clarify" | "navigate" | "chat";
  reply: string;
  mood: string;
  search_query: string | null;
  listing_description: string | null;
  navigate_to: string | null;
  clarifying_question: string | null;
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
  if (!session) return new NextResponse(null, { status: 401 });

  const { message, history } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // Load user preferences
  const userRow = (await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, session.userId)))[0];
  const preferences: UserPreferences | undefined = userRow?.preferences ? JSON.parse(userRow.preferences) : undefined;

  let decision: AgentDecision = {
    intent: "chat",
    reply: "Hey! I'm your AgentBay agent. Tell me what you want to buy or sell and I'll handle everything.",
    mood: "happy",
    search_query: null,
    listing_description: null,
    navigate_to: null,
    clarifying_question: null,
  };

  if (groq) {
    const messages = [
      { role: "system" as const, content: buildSystemPrompt(preferences) },
      ...((history || []) as { role: "user" | "assistant"; content: string }[])
        .slice(-10)
        .map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: message },
    ];
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 600,
      });
      const parsed = safeJson<AgentDecision>(res.choices[0]?.message?.content || "");
      if (parsed && parsed.intent && parsed.reply) decision = parsed;
    } catch (err) {
      console.error("[chat] groq failed:", err);
    }
  } else {
    // Keyword fallback when no Groq key
    const lower = message.toLowerCase();
    if (/(buy|find|looking|search|need|want)/.test(lower)) {
      decision = { intent: "search", reply: `Searching across all marketplaces for "${message}"...`, mood: "searching", search_query: message, listing_description: null, navigate_to: null, clarifying_question: null };
    } else if (/(sell|listing|list|have a)/.test(lower)) {
      decision = { intent: "list", reply: "Got it. Let me write an optimized listing for that.", mood: "thinking", search_query: null, listing_description: message, navigate_to: null, clarifying_question: null };
    } else if (/(marketplace|browse)/.test(lower)) {
      decision = { intent: "navigate", reply: "Taking you to the marketplace.", mood: "speaking", search_query: null, listing_description: null, navigate_to: "/test/marketplace", clarifying_question: null };
    } else if (/(preferences|settings|budget|location)/.test(lower)) {
      decision = { intent: "navigate", reply: "Let me take you to your preferences.", mood: "speaking", search_query: null, listing_description: null, navigate_to: "/test/preferences", clarifying_question: null };
    }
  }

  // Execute the action
  if (decision.intent === "search" && decision.search_query) {
    const results = await searchWebForDeals(decision.search_query, 8, preferences);
    decision.results = results;
    decision.mood = "happy";
  } else if (decision.intent === "list" && decision.listing_description) {
    const draft = await generateListing({ description: decision.listing_description });
    const id = generateId();
    await db.insert(listings).values({
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
    });
    decision.draft = draft;
    decision.listingId = id;
    decision.mood = "happy";
  }

  return NextResponse.json(decision);
}
