import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Password login is no longer supported. Please use Google Sign-In." },
    { status: 410 }
  );
}
