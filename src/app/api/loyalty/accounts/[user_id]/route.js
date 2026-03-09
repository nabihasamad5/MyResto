import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const user_id = Number(params?.user_id);
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, user_id, points, tier, created_at FROM loyalty_accounts WHERE user_id = ?",
      [user_id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch loyalty account", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user_id = Number(params?.user_id);
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
    }
    const body = await req.json();
    const hasDelta = body?.delta_points !== undefined;
    const hasSetPoints = body?.points !== undefined;
    const hasTier = body?.tier !== undefined;
    if (!hasDelta && !hasSetPoints && !hasTier) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    if (hasDelta) {
      const delta = Number(body.delta_points);
      const v = Number.isFinite(delta) ? delta : 0;
      await db.execute("UPDATE loyalty_accounts SET points = points + ? WHERE user_id = ?", [v, user_id]);
    }
    if (hasSetPoints) {
      const vnum = Number(body.points);
      const v = Number.isFinite(vnum) ? vnum : 0;
      await db.execute("UPDATE loyalty_accounts SET points = ? WHERE user_id = ?", [v, user_id]);
    }
    if (hasTier) {
      const tier = body.tier ? String(body.tier).trim() : null;
      await db.execute("UPDATE loyalty_accounts SET tier = ? WHERE user_id = ?", [tier, user_id]);
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update loyalty account", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user_id = Number(params?.user_id);
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ success: false, error: "Invalid user_id" }, { status: 400 });
    }
    await db.execute("DELETE FROM loyalty_accounts WHERE user_id = ?", [user_id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete loyalty account", details: error?.message }, { status: 500 });
  }
}

