import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { generateListing } from "@/lib/agent";
import { generateId } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const url = req.nextUrl;
  const mine = url.searchParams.get("mine") === "1";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  const rows = mine
    ? db.select().from(listings).where(eq(listings.sellerId, session.userId)).orderBy(desc(listings.createdAt)).limit(limit).all()
    : db.select().from(listings).where(eq(listings.status, "active")).orderBy(desc(listings.createdAt)).limit(limit).all();

  return NextResponse.json({ listings: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const { description, category, useAI, dryRun } = body;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  if (dryRun) {
    const { generateListing } = await import("@/lib/agent");
    const draft = await generateListing({ description, category });
    return NextResponse.json({ draft });
  }

  let title = body.title;
  let finalDescription = description;
  let finalCategory = category || "other";
  let condition = body.condition || "good";
  let priceCents = body.priceCents;
  let priceFloorCents = body.priceFloorCents;
  let tags: string[] = body.tags || [];
  let aiGenerated = false;
  let draft = null;

  if (useAI !== false) {
    draft = await generateListing({ description, category });
    title = title || draft.title;
    finalDescription = draft.description;
    finalCategory = draft.category;
    condition = draft.condition;
    priceCents = priceCents || draft.suggestedPriceCents;
    priceFloorCents = priceFloorCents || draft.priceFloorCents;
    tags = tags.length > 0 ? tags : draft.tags;
    aiGenerated = true;
  }

  if (!title || !priceCents) {
    return NextResponse.json({ error: "Missing title or price" }, { status: 400 });
  }

  const id = generateId();
  db.insert(listings).values({
    id,
    sellerId: session.userId,
    title,
    description: finalDescription,
    category: finalCategory,
    condition,
    priceCents,
    status: "active",
    source: "agentbay",
    aiGenerated,
    tags: JSON.stringify(tags),
    location: body.location || null,
    imageUrl: body.imageUrl || null,
  }).run();

  const created = db.select().from(listings).where(eq(listings.id, id)).get();
  return NextResponse.json({ listing: created, draft });
}
