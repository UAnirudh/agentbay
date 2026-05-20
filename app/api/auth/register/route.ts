import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registration via password is not supported. Please use Google Sign-In." },
    { status: 410 }
  );
}
