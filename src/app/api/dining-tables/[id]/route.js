import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "invalid id" }, { status: 400 });
    }
    const body = await _req.json();
    const is_active = body?.is_active === undefined ? null : Number(body.is_active);
    if (is_active === null || !(is_active === 0 || is_active === 1)) {
      return NextResponse.json({ success: false, error: "invalid is_active" }, { status: 400 });
    }
    const [res] = await db.execute("UPDATE dining_tables SET is_active = ? WHERE id = ?", [is_active, id]);
    if (!res || res.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, is_active } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update table", details: error?.message }, { status: 500 });
  }
}
