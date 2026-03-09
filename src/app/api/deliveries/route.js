import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const delivery_boy_id_param = searchParams.get("delivery_boy_id");
    const where = [];
    const args = [];
    if (status) {
      where.push("status = ?");
      args.push(String(status));
    }
    if (delivery_boy_id_param) {
      const v = Number(delivery_boy_id_param);
      if (!Number.isNaN(v)) {
        where.push("delivery_boy_id = ?");
        args.push(v);
      }
    }
    const sql = `SELECT id, order_id, delivery_boy_id, status, assigned_at, delivered_at FROM deliveries ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch deliveries", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const order_id = Number(body?.order_id);
    const delivery_boy_id = body?.delivery_boy_id !== undefined ? Number(body.delivery_boy_id) : null;
    const status = body?.status ? String(body.status).trim() : "pending";
    if (!Number.isFinite(order_id)) {
      return NextResponse.json({ success: false, error: "order_id is required" }, { status: 400 });
    }
    const [orderRows] = await db.execute("SELECT id FROM orders WHERE id = ?", [order_id]);
    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const assigned_at = status === "assigned" ? new Date() : null;
    const delivered_at = status === "delivered" ? new Date() : null;
    try {
      const [result] = await db.execute(
        "INSERT INTO deliveries (order_id, delivery_boy_id, status, assigned_at, delivered_at) VALUES (?, ?, ?, ?, ?)",
        [order_id, delivery_boy_id, status, assigned_at, delivered_at]
      );
      return NextResponse.json({ success: true, data: { id: result?.insertId, order_id, delivery_boy_id, status, assigned_at, delivered_at } }, { status: 201 });
    } catch {
      return NextResponse.json({ success: false, error: "Delivery for order already exists" }, { status: 409 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create delivery", details: error?.message }, { status: 500 });
  }
}

