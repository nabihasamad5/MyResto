import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const isNum = Number.isFinite(numId);

    const sql = `
        SELECT 
          o.id,
          o.order_number,
          o.user_id AS customer_id,
          o.table_id,
          o.delivery_address,
          o.order_type,
          o.total_amount AS total,
          o.tax_amount,
          o.discount_amount,
          o.service_charge,
          o.status,
          o.assigned_to,
          o.placed_at,
          o.completed_at,
          o.created_at,
          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE ${isNum ? "o.id = ?" : "o.order_number = ?"}
    `;

    const [rows] = await db.execute(sql, [isNum ? numId : id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch order", details: e?.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    const body = await req.json();
    const fields = [];
    const values = [];
    for (const key of ["status","assigned_to","completed_at"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (!fields.length) return NextResponse.json({ success: false, error: "No fields" }, { status: 400 });
    values.push(id);
    await db.execute(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update order", details: e?.message }, { status: 500 });
  }
}
