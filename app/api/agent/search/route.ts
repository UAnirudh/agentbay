import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { parseSearchIntent } from "@/lib/agents/buyer-agent";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const intent = await parseSearchIntent(query);

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (intent.category) where.category = intent.category;
    if (intent.maxPrice) where.askingPrice = { lte: intent.maxPrice };
    if (intent.condition) where.condition = intent.condition;
    if (intent.keywords) {
      where.OR = [
        { title: { contains: intent.keywords } },
        { description: { contains: intent.keywords } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, trustScore: true } } },
      orderBy: [{ fraudScore: "asc" }, { createdAt: "desc" }],
      take: 10,
    });

    return NextResponse.json({ listings, intent });
  } catch (error) {
    console.error("Agent search error:", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
