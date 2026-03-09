import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getAuthUserId(req) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookiesObj = cookieHeader
      ?.split(/;\s*/)
      .map((kv) => kv.split("="))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const tokenFromCookie = cookiesObj?.token || cookiesObj?.["auth-token"];
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return null;
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret);
    const id = decoded?.id || decoded?.userId || decoded?.user?.id;
    return typeof id !== "undefined" ? Number(id) : null;
  } catch {
    return null;
  }
}

// Expected schema: loyalty_accounts(id, user_id, points, tier, created_at)

export async function GET(req) {
  try {
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) userId = Number(session.user.id);
    } catch { }
    if (!userId) {
      userId = getAuthUserId(req);
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    let role = null;
    try {
      const [rows] = await db.execute("SELECT role FROM users WHERE id = ?", [userId]);
      role = String(rows?.[0]?.role || "").toLowerCase();
    } catch { }
    if (role && role !== "customer") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const [rows] = await db.execute(
      "SELECT id, user_id, points, tier, created_at FROM loyalty_accounts WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const acct = Array.isArray(rows) && rows.length ? rows[0] : null;
    const data = {
      user_id: userId,
      points: acct ? Number(acct.points || 0) : 0,
      tier: acct ? String(acct.tier || "") : "",
      created_at: acct ? acct.created_at : null,
    };
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch loyalty", details: error?.message }, { status: 500 });
  }
}
