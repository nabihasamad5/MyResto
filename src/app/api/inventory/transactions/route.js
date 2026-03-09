import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getAuthUserId(req) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookiesObj = cookieHeader
      ?.split(/;\s*/)
      .map((kv) => kv.split("="))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const tokenFromCookie = cookiesObj?.token || cookiesObj?.["auth-token"];
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) return null;
    const secret = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, secret);
    const id = decoded?.id || decoded?.userId || decoded?.user?.id;
    return typeof id !== "undefined" ? Number(id) : null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itemIdParam = searchParams.get("inventory_item_id");
    const where = [];
    const args = [];
    if (itemIdParam) {
      const iid = Number(itemIdParam);
      if (!Number.isNaN(iid)) {
        where.push("inventory_item_id = ?");
        args.push(iid);
      }
    }
    const sql = `SELECT id, inventory_item_id, change_amount, type, related_order_item_id, note, created_by, created_at FROM inventory_transactions ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    const [rows] = await db.execute(sql, args);
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch transactions", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const inventory_item_id = Number(body?.inventory_item_id);
    const change_amount = Number(body?.change_amount);
    const type = String(body?.type || "consumption").trim();
    const related_order_item_id = body?.related_order_item_id !== undefined ? Number(body.related_order_item_id) : null;
    const note = body?.note ? String(body.note).trim() : null;
    if (!Number.isFinite(inventory_item_id) || !Number.isFinite(change_amount) || !type) {
      return NextResponse.json({ success: false, error: "inventory_item_id, change_amount and type are required" }, { status: 400 });
    }
    const [itemRows] = await db.execute("SELECT id FROM inventory_items WHERE id = ?", [inventory_item_id]);
    if (!Array.isArray(itemRows) || itemRows.length === 0) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }
    const created_by = getAuthUserId(req);
    const [result] = await db.execute(
      "INSERT INTO inventory_transactions (inventory_item_id, change_amount, type, related_order_item_id, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [inventory_item_id, change_amount, type, related_order_item_id, note, created_by]
    );
    return NextResponse.json({ success: true, data: { id: result?.insertId, inventory_item_id, change_amount, type, related_order_item_id, note, created_by } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create transaction", details: error?.message }, { status: 500 });
  }
}

