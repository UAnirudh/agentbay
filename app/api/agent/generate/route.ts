import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { generateListing } from "@/lib/agents/seller-agent";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { description, photoUrl } = await req.json();

    if (!description && !photoUrl) {
      return NextResponse.json({ error: "Description or photo URL required" }, { status: 400 });
    }

    const listing = await generateListing(description || "Item shown in photo", photoUrl);
    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Agent generate error:", error);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
