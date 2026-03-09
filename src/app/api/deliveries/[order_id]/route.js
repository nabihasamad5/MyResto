import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const order_id = Number(params?.order_id);
    if (!Number.isFinite(order_id)) {
      return NextResponse.json({ success: false, error: "Invalid order_id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, order_id, delivery_boy_id, status, assigned_at, delivered_at FROM deliveries WHERE order_id = ?",
      [order_id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch delivery", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const order_id = Number(params?.order_id);
    if (!Number.isFinite(order_id)) {
      return NextResponse.json({ success: false, error: "Invalid order_id" }, { status: 400 });
    }
    const body = await req.json();
    const fields = [];
    const values = [];
    let willSetAssignedAt = false;
    let willSetDeliveredAt = false;
    if (body?.delivery_boy_id !== undefined) {
      const v = Number(body.delivery_boy_id);
      fields.push("delivery_boy_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.status !== undefined) {
      const s = String(body.status).trim();
      fields.push("status = ?");
      values.push(s);
      if (s === "assigned") willSetAssignedAt = true;
      if (s === "delivered") willSetDeliveredAt = true;
    }
    if (willSetAssignedAt) {
      fields.push("assigned_at = ?");
      values.push(new Date());
    }
    if (willSetDeliveredAt) {
      fields.push("delivered_at = ?");
      values.push(new Date());
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(order_id);
    await db.execute(`UPDATE deliveries SET ${fields.join(", ")} WHERE order_id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update delivery", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const order_id = Number(params?.order_id);
    if (!Number.isFinite(order_id)) {
      return NextResponse.json({ success: false, error: "Invalid order_id" }, { status: 400 });
    }
    await db.execute("DELETE FROM deliveries WHERE order_id = ?", [order_id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete delivery", details: error?.message }, { status: 500 });
  }
}

