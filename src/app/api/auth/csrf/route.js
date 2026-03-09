import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const token = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.json({ csrfToken: token }, { status: 200 });
  // Double-submit cookie for CSRF; readable by client
  res.cookies.set("csrf-token", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });
  return res;
}

