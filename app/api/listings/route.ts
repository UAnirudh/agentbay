import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectListingFraud } from "@/lib/fraud/detector";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const maxPrice = searchParams.get("maxPrice");
  const condition = searchParams.get("condition");
  const sellerId = searchParams.get("sellerId");

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (sellerId) where.sellerId = sellerId;
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (maxPrice) where.askingPrice = { lte: parseFloat(maxPrice) };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { category: { contains: q } },
    ];
  }

  const listings = await prisma.listing.findMany({
    where,
    include: { seller: { select: { id: true, name: true, trustScore: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, category, condition, askingPrice, floorPrice, photoUrl, city, fulfillment } = body;

    if (!title || !description || !askingPrice) {
      return NextResponse.json({ error: "Title, description, and price are required" }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!seller) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const accountAge = Math.floor(
      (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const listingCount = await prisma.listing.count({ where: { sellerId: seller.id } });

    const fraud = detectListingFraud({
      askingPrice,
      title,
      description,
      accountAgeDays: accountAge,
      sellerListingCount: listingCount,
    });

    if (fraud.action === "BLOCK") {
      return NextResponse.json({ error: "Listing flagged for review: " + fraud.flags[0] }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.userId,
        title,
        description,
        category: category || "Other",
        condition: condition || "GOOD",
        askingPrice: parseFloat(askingPrice),
        floorPrice: floorPrice ? parseFloat(floorPrice) : parseFloat(askingPrice) * 0.8,
        photoUrl: photoUrl || null,
        city: city || null,
        fulfillment: fulfillment || "SHIPPING,LOCAL_PICKUP",
        fraudScore: fraud.score,
        aiGenerated: body.aiGenerated ?? true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
