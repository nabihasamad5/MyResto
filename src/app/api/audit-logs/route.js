import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const action = searchParams.get("action");
    const where = [];
    const args = [];
    if (userIdParam) {
      const v = Number(userIdParam);
      if (!Number.isNaN(v)) {
        where.push("user_id = ?");
        args.push(v);
      }
    }
    if (action) {
      where.push("action = ?");
      args.push(String(action));
    }
    const sql = `SELECT id, user_id, action, payload, ip, created_at FROM audit_logs ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch audit logs", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const user_id = body?.user_id !== undefined ? Number(body.user_id) : null;
    const action = String(body?.action || "").trim();
    const payload = body?.payload ? JSON.stringify(body.payload) : null;
    const ip = body?.ip ? String(body.ip).trim() : null;
    if (!action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }
    const [result] = await db.execute(
      "INSERT INTO audit_logs (user_id, action, payload, ip, created_at) VALUES (?, ?, ?, ?, NOW())",
      [user_id, action, payload, ip]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, user_id, action, payload, ip } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create audit log", details: error?.message }, { status: 500 });
  }
}

