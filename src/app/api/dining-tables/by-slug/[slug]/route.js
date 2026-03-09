import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const slug = String(params?.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ success: false, error: "invalid slug" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, name, seats, location, qr_code_slug, is_active, created_at FROM dining_tables WHERE qr_code_slug = ? LIMIT 1",
      [slug]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch table", details: error?.message }, { status: 500 });
  }
}
