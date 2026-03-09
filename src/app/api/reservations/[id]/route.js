import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const fields = [];
    const values = [];

    // Handle date+time combination
    if (body.reserved_for) {
      fields.push("reserved_for = ?");
      values.push(String(body.reserved_for).replace("T", " "));
    } else if (body.date && body.time) {
      fields.push("reserved_for = ?");
      values.push(`${body.date} ${body.time}`);
    }

    if (body.guests !== undefined) { fields.push("guests = ?"); values.push(Number(body.guests)); }
    if (body.status !== undefined) { fields.push("status = ?"); values.push(body.status); }
    if (body.notes !== undefined) { fields.push("notes = ?"); values.push(body.notes); }
    if (body.user_id !== undefined) { fields.push("user_id = ?"); values.push(body.user_id ? Number(body.user_id) : null); }
    if (body.table_id !== undefined) { fields.push("table_id = ?"); values.push(body.table_id ? Number(body.table_id) : null); }

    if (!fields.length) return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });

    values.push(id);

    await db.execute(`UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update reservation", details: e?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    await db.execute("DELETE FROM reservations WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to delete reservation", details: e?.message }, { status: 500 });
  }
}

