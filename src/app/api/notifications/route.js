import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const role = searchParams.get("role");
    const unreadOnly = searchParams.get("unread") === "1" || searchParams.get("unread") === "true";
    const where = [];
    const args = [];
    if (userIdParam) {
      const v = Number(userIdParam);
      if (!Number.isNaN(v)) {
        where.push("user_id = ?");
        args.push(v);
      }
    }
    if (role) {
      where.push("role = ?");
      args.push(String(role));
    }
    if (unreadOnly) {
      where.push("is_read = 0");
    }
    const sql = `SELECT id, user_id, role, title, message, data, is_read, created_at FROM notifications ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const user_id = body?.user_id !== undefined ? Number(body.user_id) : null;
    const role = body?.role ? String(body.role).trim() : null;
    const title = String(body?.title || "").trim();
    const message = String(body?.message || "").trim();
    const data = body?.data ? JSON.stringify(body.data) : null;
    if (!title || !message) {
      return NextResponse.json({ success: false, error: "title and message are required" }, { status: 400 });
    }
    const [result] = await db.execute(
      "INSERT INTO notifications (user_id, role, title, message, data, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
      [user_id, role, title, message, data]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, user_id, role, title, message, data, is_read: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create notification", details: error?.message }, { status: 500 });
  }
}

