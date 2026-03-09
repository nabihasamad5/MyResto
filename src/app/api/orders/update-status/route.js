import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitOrderUpdate } from "@/lib/events";

const ALLOWED = new Set([
  "created",
  "accepted",
  "preparing",
  "ready",
  "served",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "completed",
]);

export async function PATCH(req) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    const status = String(body?.status || "").trim();
    if (!Number.isFinite(id) || !ALLOWED.has(status)) {
      return NextResponse.json({ success: false, error: "invalid id or status" }, { status: 400 });
    }
    await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    if (status === "completed" || status === "cancelled") {
      const [rows] = await db.execute("SELECT table_id FROM orders WHERE id = ?", [id]);
      const tableId = rows?.[0]?.table_id ?? null;
      if (tableId) {
        await db.execute("UPDATE dining_tables SET is_active = 1 WHERE id = ?", [tableId]);
      }
    }
    // Notification logic
    try {
      const [ordRows] = await db.execute("SELECT user_id, order_number, assigned_to FROM orders WHERE id = ?", [id]);
      if (ordRows && ordRows.length > 0) {
        const o = ordRows[0];
        // Notify customer
        if (o.user_id) {
          await db.execute(
            "INSERT INTO notifications (user_id, role, title, message, data, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
            [o.user_id, "customer", `Order ${status}`, `Your order #${o.order_number} is now ${status.replace(/_/g, " ")}.`, JSON.stringify({ order_id: id, status })]
          );
        }
        // Notify staff (assigned_to) if status changed by someone else? 
        // For simplicity, just notify assigned staff about important updates if needed
        if (o.assigned_to) {
           await db.execute(
            "INSERT INTO notifications (user_id, role, title, message, data, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
            [o.assigned_to, "staff", `Order ${status}`, `Order #${o.order_number} status updated to ${status.replace(/_/g, " ")}.`, JSON.stringify({ order_id: id, status })]
          );
        }
      }
    } catch (e) {
      console.error("Notification insert error:", e);
    }

    try {
      emitOrderUpdate({ id, status });
    } catch {}
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update status", details: error?.message }, { status: 500 });
  }
}
