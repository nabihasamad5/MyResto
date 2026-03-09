import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  res.headers.append("Set-Cookie", `token=; Expires=${expires}; Path=/; HttpOnly; SameSite=Lax`);
  res.headers.append("Set-Cookie", `auth-token=; Expires=${expires}; Path=/; HttpOnly; SameSite=Lax`);
  return res;
}

