import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where = [];
    const args = [];
    if (from) { where.push("created_at >= ?"); args.push(from); }
    if (to) { where.push("created_at <= ?"); args.push(to); }
    const [ordersAgg] = await db.execute(
      `SELECT 
         COUNT(*) AS orders_count,
         COALESCE(SUM(total_amount),0) AS orders_total,
         COALESCE(SUM(tax_amount),0) AS tax_total,
         COALESCE(SUM(service_charge),0) AS service_total
       FROM orders
       ${where.length ? "WHERE " + where.join(" AND ") : ""}`, args
    );
    const [expensesAgg] = await db.execute(
      `SELECT 
         COUNT(*) AS expenses_count,
         COALESCE(SUM(amount),0) AS expenses_total
       FROM expenses
       ${where.length ? "WHERE " + where.join(" AND ") : ""}`, args
    );
    const ord = ordersAgg?.[0] || {};
    const exp = expensesAgg?.[0] || {};
    const profit = Number(ord.orders_total || 0) - Number(exp.expenses_total || 0);
    return NextResponse.json({ success: true, data: { orders: ord, expenses: exp, profit } }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch finance report", details: e?.message }, { status: 500 });
  }
}

