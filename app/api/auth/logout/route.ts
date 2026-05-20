import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { getAppUrl } from "@/lib/utils";

export async function GET() {
  const appUrl = getAppUrl();
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
