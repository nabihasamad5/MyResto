import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const fields = [];
    const values = [];
    if (body?.is_read !== undefined) {
      const v = body.is_read ? 1 : 0;
      fields.push("is_read = ?");
      values.push(v);
    }
    if (body?.title !== undefined) {
      fields.push("title = ?");
      values.push(body.title ? String(body.title).trim() : null);
    }
    if (body?.message !== undefined) {
      fields.push("message = ?");
      values.push(body.message ? String(body.message).trim() : null);
    }
    if (body?.data !== undefined) {
      const v = body.data !== null && body.data !== undefined ? JSON.stringify(body.data) : null;
      fields.push("data = ?");
      values.push(v);
    }
    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields provided" }, { status: 400 });
    }
    values.push(id);
    await db.execute(`UPDATE notifications SET ${fields.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update notification", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
    }
    await db.execute("DELETE FROM notifications WHERE id = ?", [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete notification", details: error?.message }, { status: 500 });
  }
}

