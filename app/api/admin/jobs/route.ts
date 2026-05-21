import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { systemJobs } from "@/lib/schema";
import { tickDueJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const rows = await db.select().from(systemJobs);
  return NextResponse.json({ jobs: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return new NextResponse(null, { status: 404 });
  const { force } = await req.json().catch(() => ({ force: false }));
  if (force) {
    await db.delete(systemJobs);
  }
  const result = await tickDueJobs();
  return NextResponse.json(result);
}
