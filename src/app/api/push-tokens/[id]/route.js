import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM push_tokens WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete token", details: error?.message }, { status: 500 });
  }
}

