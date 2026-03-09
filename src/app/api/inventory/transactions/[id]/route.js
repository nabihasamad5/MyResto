import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, inventory_item_id, change_amount, type, related_order_item_id, note, created_by, created_at FROM inventory_transactions WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch transaction", details: error?.message }, { status: 500 });
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
    if (body?.inventory_item_id !== undefined) {
      const v = Number(body.inventory_item_id);
      fields.push("inventory_item_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.change_amount !== undefined) {
      const v = Number(body.change_amount);
      fields.push("change_amount = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.type !== undefined) {
      fields.push("type = ?");
      values.push(body.type ? String(body.type).trim() : null);
    }
    if (body?.related_order_item_id !== undefined) {
      const v = Number(body.related_order_item_id);
      fields.push("related_order_item_id = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.note !== undefined) {
      fields.push("note = ?");
      values.push(body.note ? String(body.note).trim() : null);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE inventory_transactions SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update transaction", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM inventory_transactions WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete transaction", details: error?.message }, { status: 500 });
  }
}

