import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, agentSessions, agentMessages } from "@/lib/schema";
import { searchWebForDeals, type WebDeal } from "@/lib/agent";
import { generateId } from "@/lib/utils";
import { eq, like, or, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const { query, maxResults } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const sessionId = generateId();
  await db.insert(agentSessions).values({
    id: sessionId,
    userId: session.userId,
    mode: "buy",
    query,
    status: "active",
  });

  await db.insert(agentMessages).values({
    id: generateId(),
    sessionId,
    role: "user",
    content: query,
  });

  const tokens = query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
  const internalRows = tokens.length > 0
    ? await db.select().from(listings)
        .where(and(
          eq(listings.status, "active"),
          or(...tokens.map((t: string) => or(like(listings.title, `%${t}%`), like(listings.description, `%${t}%`))))
        ))
        .limit(5)
    : [];

  const internalDeals: WebDeal[] = internalRows.map((l) => ({
    title: l.title,
    description: l.description.slice(0, 200),
    priceCents: l.priceCents,
    source: "agentbay",
    url: `/test/listings/${l.id}`,
    condition: l.condition,
    location: l.location || undefined,
    matchScore: 90,
    reasoning: "Listed directly on AgentBay — instant purchase available.",
    negotiable: true,
    estimatedSavings: 0,
  }));

  const webDeals = await searchWebForDeals(query, Math.max(5, (maxResults || 8) - internalDeals.length));
  const all = [...internalDeals, ...webDeals].sort((a, b) => b.matchScore - a.matchScore);

  await db.insert(agentMessages).values({
    id: generateId(),
    sessionId,
    role: "agent",
    content: `Found ${all.length} matches across ${new Set(all.map((d) => d.source)).size} sources.`,
    metadata: JSON.stringify({ resultCount: all.length }),
  });

  await db.update(agentSessions).set({
    resultData: JSON.stringify(all),
    status: "complete",
  }).where(eq(agentSessions.id, sessionId));

  return NextResponse.json({ sessionId, results: all });
}
