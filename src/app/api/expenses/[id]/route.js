import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const [rows] = await db.execute(
      "SELECT id, title, amount, category, incurred_at, notes, created_by, created_at FROM expenses WHERE id = ?",
      [id]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch expense", details: error?.message }, { status: 500 });
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
    if (body?.title !== undefined) {
      fields.push("title = ?");
      values.push(body.title ? String(body.title).trim() : null);
    }
    if (body?.amount !== undefined) {
      const v = Number(body.amount);
      fields.push("amount = ?");
      values.push(Number.isFinite(v) ? v : null);
    }
    if (body?.category !== undefined) {
      fields.push("category = ?");
      values.push(body.category ? String(body.category).trim() : null);
    }
    if (body?.incurred_at !== undefined) {
      fields.push("incurred_at = ?");
      values.push(body.incurred_at ? String(body.incurred_at) : null);
    }
    if (body?.notes !== undefined) {
      fields.push("notes = ?");
      values.push(body.notes ? String(body.notes).trim() : null);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update expense", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM expenses WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete expense", details: error?.message }, { status: 500 });
  }
}

