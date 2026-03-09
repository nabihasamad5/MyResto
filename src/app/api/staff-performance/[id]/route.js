import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, user_id, month, orders_handled, avg_order_time_seconds, rating_avg, created_at FROM staff_performance WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch staff performance", details: error?.message }, { status: 500 });
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
    if (body?.orders_handled !== undefined) {
      const v = Number(body.orders_handled);
      fields.push("orders_handled = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (body?.avg_order_time_seconds !== undefined) {
      const v = Number(body.avg_order_time_seconds);
      fields.push("avg_order_time_seconds = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (body?.rating_avg !== undefined) {
      const v = Number(body.rating_avg);
      fields.push("rating_avg = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE staff_performance SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update staff performance", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM staff_performance WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete staff performance", details: error?.message }, { status: 500 });
  }
}

