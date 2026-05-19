import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, email: true, name: true, phone: true,
      trustScore: true, agentConfig: true, identityLevel: true, createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: body.name,
      phone: body.phone,
      agentConfig: body.agentConfig ? JSON.stringify(body.agentConfig) : undefined,
    },
    select: {
      id: true, email: true, name: true, phone: true,
      trustScore: true, agentConfig: true,
    },
  });

  return NextResponse.json({ user });
}
