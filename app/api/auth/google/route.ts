import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAppUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const ref = url.searchParams.get("ref") || "";

  const state = JSON.stringify({
    csrf: crypto.randomBytes(16).toString("hex"),
    ref,
  });
  const encodedState = Buffer.from(state).toString("base64url");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "your-google-client-id") {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env" },
      { status: 503 }
    );
  }

  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: encodedState,
    access_type: "offline",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set("agentbay_oauth_state", encodedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
