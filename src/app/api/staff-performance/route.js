import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");
    const where = [];
    const args = [];
    if (userIdParam) {
      const v = Number(userIdParam);
      if (!Number.isNaN(v)) {
        where.push("user_id = ?");
        args.push(v);
      }
    }
    const sql = `SELECT id, user_id, month, orders_handled, avg_order_time_seconds, rating_avg, created_at FROM staff_performance ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY month DESC, created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch staff performance", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const user_id = Number(body?.user_id);
    const month = body?.month ? String(body.month) : null;
    const orders_handled = body?.orders_handled !== undefined ? Number(body.orders_handled) : 0;
    const avg_order_time_seconds = body?.avg_order_time_seconds !== undefined ? Number(body.avg_order_time_seconds) : 0;
    const rating_avg_num = Number(body?.rating_avg);
    const rating_avg = Number.isFinite(rating_avg_num) ? rating_avg_num : 0;
    if (!Number.isFinite(user_id) || !month) {
      return NextResponse.json({ success: false, error: "user_id and month are required" }, { status: 400 });
    }
    const [result] = await db.execute(
      "INSERT INTO staff_performance (user_id, month, orders_handled, avg_order_time_seconds, rating_avg, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [user_id, month, orders_handled, avg_order_time_seconds, rating_avg]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, user_id, month, orders_handled, avg_order_time_seconds, rating_avg } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create staff performance", details: error?.message }, { status: 500 });
  }
}

