import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, seats, location, qr_code_slug, is_active FROM dining_tables ORDER BY id ASC"
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch tables", details: e?.message }, { status: 500 });
  }
}

