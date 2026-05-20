import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest, isAdminEmail } from "@/lib/auth";

// Routes accessible without any auth
const PUBLIC_ROUTES = ["/", "/leaderboard", "/login", "/register"];
const PUBLIC_PREFIXES = ["/api/auth/", "/api/leaderboard", "/api/waitlist/join", "/_next/", "/favicon", "/og-image"];

// Routes accessible to authenticated (waitlisted) users
const WAITLIST_ROUTES = ["/waitlist"];
const WAITLIST_API = ["/api/waitlist/stats", "/api/waitlist/referral"];

// Routes that should return 404 for non-admins (existing product routes)
const INTERNAL_PREFIXES = [
  "/dashboard",
  "/api/agent",
  "/api/listings",
  "/api/negotiations",
  "/api/payments",
  "/api/users",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isWaitlistRoute(pathname: string): boolean {
  return WAITLIST_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))
    || WAITLIST_API.some((r) => pathname.startsWith(r));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/cron");
}

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // Internal product routes → 404 for non-admins
  if (isInternalRoute(pathname)) {
    if (!session || !session.isAdmin) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // Admin-only routes
  if (isAdminRoute(pathname)) {
    if (!session || !session.isAdmin) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // Waitlist routes require authentication
  if (isWaitlistRoute(pathname)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // For authenticated users hitting login/register, redirect to waitlist
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};
