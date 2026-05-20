import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(appUrl + "/");
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete("agentbay_token");
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete("agentbay_token");
  return response;
}
