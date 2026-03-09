import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, name, sku, unit, cost_price, current_stock, low_stock_threshold, created_at FROM inventory_items WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch inventory item", details: error?.message }, { status: 500 });
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
    if (body?.name !== undefined) {
      fields.push("name = ?");
      values.push(String(body.name).trim());
    }
    if (body?.sku !== undefined) {
      fields.push("sku = ?");
      values.push(body.sku ? String(body.sku).trim() : null);
    }
    if (body?.unit !== undefined) {
      fields.push("unit = ?");
      values.push(body.unit ? String(body.unit).trim() : null);
    }
    if (body?.cost_price !== undefined) {
      const v = Number(body.cost_price);
      fields.push("cost_price = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (body?.current_stock !== undefined) {
      const v = Number(body.current_stock);
      fields.push("current_stock = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (body?.low_stock_threshold !== undefined) {
      const v = Number(body.low_stock_threshold);
      fields.push("low_stock_threshold = ?");
      values.push(Number.isFinite(v) ? v : 0);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE inventory_items SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update inventory item", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM inventory_items WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete inventory item", details: error?.message }, { status: 500 });
  }
}

