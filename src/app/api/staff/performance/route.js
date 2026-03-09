import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where = [];
    const args = [];
    where.push("assigned_to IS NOT NULL");
    if (from) { where.push("placed_at >= ?"); args.push(from); }
    if (to) { where.push("placed_at <= ?"); args.push(to); }
    const sql = `
      SELECT 
        assigned_to AS staff_id,
        COUNT(*) AS orders_count,
        SUM(total_amount) AS revenue,
        AVG(TIMESTAMPDIFF(MINUTE, placed_at, COALESCE(completed_at, NOW()))) AS avg_minutes
      FROM orders
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      GROUP BY assigned_to
      ORDER BY orders_count DESC
    `;
    const [rows] = await db.execute(sql, args);
    const ids = (rows || []).map((r) => r.staff_id).filter(Boolean);
    let usersMap = {};
    if (ids.length) {
      const [users] = await db.execute(
        `SELECT id, name, role, email FROM users WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids
      );
      usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
    }
    const data = (rows || []).map((r) => ({
      staff_id: r.staff_id,
      name: usersMap[r.staff_id]?.name || null,
      role: usersMap[r.staff_id]?.role || null,
      email: usersMap[r.staff_id]?.email || null,
      orders_count: Number(r.orders_count || 0),
      revenue: Number(r.revenue || 0),
      avg_minutes: Number(r.avg_minutes || 0),
    }));
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch staff performance", details: error?.message }, { status: 500 });
  }
}

