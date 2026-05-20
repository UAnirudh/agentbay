import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, referralEvents } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { signToken, isAdminEmail, COOKIE_NAME } from "@/lib/auth";
import { generateUniqueReferralCode, creditReferral, getQueuePosition } from "@/lib/referral";
import { sendWelcomeEmail } from "@/lib/email";
import { generateId, getAppUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error)}`);
  if (!code || !stateParam) return NextResponse.redirect(`${appUrl}/login?error=missing_params`);

  const storedState = req.cookies.get("agentbay_oauth_state")?.value;
  if (!storedState || storedState !== stateParam) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  let ref = "";
  try {
    const parsed = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    ref = parsed.ref || "";
  } catch { /* ignore */ }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  let tokens: { access_token?: string };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    tokens = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${appUrl}/login?error=token_exchange_failed`);
  }

  if (!tokens.access_token) return NextResponse.redirect(`${appUrl}/login?error=no_access_token`);

  let profile: { sub?: string; email?: string; name?: string; picture?: string };
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    profile = await profileRes.json();
  } catch {
    return NextResponse.redirect(`${appUrl}/login?error=profile_fetch_failed`);
  }

  if (!profile.email || !profile.sub) return NextResponse.redirect(`${appUrl}/login?error=invalid_profile`);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const isAdmin = isAdminEmail(profile.email);

  let user = db.select().from(users).where(
    or(eq(users.email, profile.email), eq(users.googleId, profile.sub))
  ).get();

  const isNewUser = !user;

  if (!user) {
    const referralCode = await generateUniqueReferralCode();
    const id = generateId();
    db.insert(users).values({
      id,
      email: profile.email,
      name: profile.name || null,
      image: profile.picture || null,
      googleId: profile.sub,
      isAdmin,
      isApproved: isAdmin,
      referralCode,
      referredBy: ref || null,
      queueScore: 0,
    }).run();
    user = db.select().from(users).where(eq(users.id, id)).get()!;
  } else {
    db.update(users).set({
      googleId: user.googleId || profile.sub,
      name: profile.name || user.name,
      image: profile.picture || user.image,
      isAdmin: isAdmin || user.isAdmin,
      isApproved: isAdmin ? true : user.isApproved,
      lastLogin: new Date(),
    }).where(eq(users.id, user.id)).run();
    user = db.select().from(users).where(eq(users.id, user.id)).get()!;
  }

  if (isNewUser && ref && user) {
    await creditReferral(ref, user.email, user.id, ip);
  }

  if (isNewUser && user) {
    const position = await getQueuePosition(user.id);
    sendWelcomeEmail(user.email, user.name || "", user.referralCode, position).catch(console.error);
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isAdmin: user.isAdmin,
    isApproved: user.isApproved,
    referralCode: user.referralCode,
  });

  const response = NextResponse.redirect(`${appUrl}/${user.isAdmin ? "admin" : "waitlist"}`);
  response.cookies.delete("agentbay_oauth_state");
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
