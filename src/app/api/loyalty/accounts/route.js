import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(
      "SELECT id, user_id, points, tier, created_at FROM loyalty_accounts ORDER BY points DESC"
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch loyalty accounts", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const user_id = Number(body?.user_id);
    const pointsNum = Number(body?.points);
    const points = Number.isFinite(pointsNum) ? pointsNum : 0;
    const tier = body?.tier ? String(body.tier).trim() : "basic";
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ success: false, error: "user_id is required" }, { status: 400 });
    }
    const [userRows] = await db.execute("SELECT id FROM users WHERE id = ?", [user_id]);
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    try {
      const [result] = await db.execute(
        "INSERT INTO loyalty_accounts (user_id, points, tier, created_at) VALUES (?, ?, ?, NOW())",
        [user_id, points, tier]
      );
      return NextResponse.json({ success: true, data: { id: result?.insertId, user_id, points, tier } }, { status: 201 });
    } catch {
      return NextResponse.json({ success: false, error: "Account already exists" }, { status: 409 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create loyalty account", details: error?.message }, { status: 500 });
  }
}
