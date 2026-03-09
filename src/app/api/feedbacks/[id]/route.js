import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, order_id, user_id, menu_item_id, rating, comments, created_at FROM feedbacks WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch feedback", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const fields = [];
    const values = [];
    if (body?.order_id !== undefined) {
      const v = Number(body.order_id);
      fields.push("order_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.user_id !== undefined) {
      const v = Number(body.user_id);
      fields.push("user_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.menu_item_id !== undefined) {
      const v = Number(body.menu_item_id);
      fields.push("menu_item_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.rating !== undefined) {
      const v = Number(body.rating);
      fields.push("rating = ?");
      values.push(Number.isFinite(v) ? Math.max(1, Math.min(5, v)) : null);
    }
    if (body?.comments !== undefined) {
      fields.push("comments = ?");
      values.push(body.comments ? String(body.comments).trim() : null);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE feedbacks SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update feedback", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM feedbacks WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete feedback", details: error?.message }, { status: 500 });
  }
}

