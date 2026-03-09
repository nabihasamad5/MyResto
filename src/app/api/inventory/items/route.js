import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, sku, unit, cost_price, current_stock, low_stock_threshold, created_at FROM inventory_items ORDER BY name ASC"
    );
    return NextResponse.json({ success: true, data: rows || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch inventory items", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
    }
    const sku = body?.sku ? String(body.sku).trim() : null;
    const unit = body?.unit ? String(body.unit).trim() : "pcs";
    const cost_price_num = Number(body?.cost_price);
    const cost_price = Number.isFinite(cost_price_num) ? cost_price_num : 0;
    const current_stock_num = Number(body?.current_stock);
    const current_stock = Number.isFinite(current_stock_num) ? current_stock_num : 0;
    const low_stock_threshold_num = Number(body?.low_stock_threshold);
    const low_stock_threshold = Number.isFinite(low_stock_threshold_num) ? low_stock_threshold_num : 0;

    const [result] = await db.execute(
      "INSERT INTO inventory_items (name, sku, unit, cost_price, current_stock, low_stock_threshold, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [name, sku, unit, cost_price, current_stock, low_stock_threshold]
    );

    return NextResponse.json({ success: true, data: { id: result?.insertId, name, sku, unit, cost_price, current_stock, low_stock_threshold } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create inventory item", details: error?.message }, { status: 500 });
  }
}

